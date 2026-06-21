"""
Chatbot PostgreSQL — FastAPI Application

All textual data (conversations, messages, knowledge base, runtime variables)
is stored in PostgreSQL. No PDF files are loaded at runtime.

Endpoints:
  POST   /chat                  Ask a question and get an AI response
  POST   /conversations         Create a new conversation
  GET    /conversations         List conversations
  GET    /conversations/{id}    Get conversation with messages
  POST   /knowledge             Add a knowledge entry
  GET    /knowledge             List / search knowledge entries
  PUT    /knowledge/{id}        Update a knowledge entry
  DELETE /knowledge/{id}        Delete a knowledge entry
  POST   /ingest                One-time ingestion from text / PDFs
  GET    /variables             List runtime variables
  PUT    /variables/{key}       Set a runtime variable
  GET    /variables/{key}       Get a runtime variable
  DELETE /variables/{key}       Delete a runtime variable
  GET    /health                Health check
"""

import asyncio
import uuid
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from config import settings, runtime_config
from db import db
from llm import generate_response, generate_embedding_local


# ─────────────────────────────── Pydantic Schemas ───────────────────────────────

class ChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str = Field(..., min_length=1, max_length=4000)
    user_id: str = "anonymous"


class ChatResponse(BaseModel):
    conversation_id: str
    reply: str


class ConversationCreate(BaseModel):
    user_id: str = "anonymous"
    title: str = ""


class KnowledgeCreate(BaseModel):
    topic: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1, max_length=10000)
    metadata: Optional[dict] = None


class KnowledgeUpdate(BaseModel):
    topic: Optional[str] = None
    content: Optional[str] = None
    metadata: Optional[dict] = None


class IngestRequest(BaseModel):
    entries: list[KnowledgeCreate] = Field(..., description="List of knowledge entries to ingest")
    source: str = "manual"


class VariableSet(BaseModel):
    value: dict | list | str | int | float | bool | None


# ─────────────────────────────── Application ───────────────────────────────

async def poll_admin_config():
    while True:
        try:
            await asyncio.wait_for(config_refresh_event.wait(), timeout=30)
            config_refresh_event.clear()
        except asyncio.TimeoutError:
            pass
        changed = await runtime_config.fetch_from_express()
        if changed:
            print(f"[Config] LLM config updated from admin panel (v{runtime_config.version})")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect()
    # Fetch LLM config from admin panel immediately on startup
    await runtime_config.fetch_from_express()
    task = asyncio.create_task(poll_admin_config())
    yield
    task.cancel()
    await db.close()


app = FastAPI(
    title="DevOrbit Chatbot — PostgreSQL",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/health")
async def health():
    return {"status": "ok", "database": "postgresql", "llm_model": runtime_config.model or settings.effective_llm_model}


# ─────────────────────────────── Chat ───────────────────────────────

@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    # 1. Create or reuse conversation
    cid = req.conversation_id
    if cid:
        conv = await db.get_conversation(cid)
        if not conv:
            raise HTTPException(404, "Conversation not found")
    else:
        conv = await db.create_conversation(user_id=req.user_id, title=req.message[:80])
        cid = conv["id"]

    # 2. Store user message
    await db.add_message(cid, "user", req.message)

    # 3. Retrieve relevant knowledge
    context_chunks = await db.search_knowledge(req.message, limit=settings.max_knowledge_results)

    # 4. Try vector search if embeddings exist
    if not context_chunks:
        try:
            emb = await generate_embedding_local(req.message)
            vec_results = await db.search_knowledge_vector(
                emb, limit=settings.max_knowledge_results,
                threshold=settings.similarity_threshold,
            )
            context_chunks = vec_results
        except Exception:
            pass

    # 5. Get recent conversation history
    history = await db.get_recent_messages(cid, n=settings.max_history_messages)

    # 6. Generate response via LLM
    reply = await generate_response(req.message, context_chunks, history)

    # 7. Store assistant response
    await db.add_message(cid, "assistant", reply)

    return ChatResponse(conversation_id=str(cid), reply=reply)


# ─────────────────────────────── Conversations ───────────────────────────────

@app.post("/conversations")
async def create_conversation(req: ConversationCreate):
    conv = await db.create_conversation(user_id=req.user_id, title=req.title)
    return conv


@app.get("/conversations")
async def list_conversations(user_id: str = "anonymous", limit: int = 20, offset: int = 0):
    convs = await db.list_conversations(user_id=user_id, limit=limit, offset=offset)
    return {"items": convs, "total": len(convs)}


@app.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    conv = await db.get_conversation(conversation_id)
    if not conv:
        raise HTTPException(404, "Conversation not found")
    messages = await db.get_messages(conversation_id)
    conv["messages"] = messages
    return conv


# ─────────────────────────────── Knowledge Base ───────────────────────────────

@app.post("/knowledge")
async def add_knowledge(req: KnowledgeCreate):
    try:
        emb = await generate_embedding_local(req.topic + " " + req.content)
    except Exception:
        emb = None
    entry = await db.add_knowledge(
        topic=req.topic,
        content=req.content,
        metadata=req.metadata,
        embedding=emb,
    )
    return entry


@app.get("/knowledge")
async def list_knowledge(topic: Optional[str] = None, search: Optional[str] = None,
                         limit: int = 50, offset: int = 0):
    if search:
        results = await db.search_knowledge(search, limit=limit)
        return {"items": results, "total": len(results)}
    items = await db.list_knowledge(topic=topic, limit=limit, offset=offset)
    return {"items": items, "total": len(items)}


@app.put("/knowledge/{knowledge_id}")
async def update_knowledge(knowledge_id: str, req: KnowledgeUpdate):
    entry = await db.update_knowledge(
        knowledge_id=knowledge_id,
        topic=req.topic,
        content=req.content,
        metadata=req.metadata,
    )
    if not entry:
        raise HTTPException(404, "Knowledge entry not found")
    return entry


@app.delete("/knowledge/{knowledge_id}")
async def delete_knowledge(knowledge_id: str):
    deleted = await db.delete_knowledge(knowledge_id)
    if not deleted:
        raise HTTPException(404, "Knowledge entry not found")
    return {"status": "deleted"}


# ─────────────────────────────── Runtime Config Refresh ───────────────────────────────

config_refresh_event = asyncio.Event()


@app.post("/refresh-config")
async def trigger_config_refresh():
    changed = await runtime_config.fetch_from_express()
    if changed:
        print(f"[Config] LLM config refreshed on demand (v{runtime_config.version})")
    config_refresh_event.set()
    return {"refreshed": changed}


# ─────────────────────────────── Ingestion ───────────────────────────────

@app.post("/ingest")
async def ingest(req: IngestRequest):
    # Clear existing entries from this source first
    await db.delete_knowledge_by_source(req.source)
    count = 0
    for entry in req.entries:
        try:
            emb = await generate_embedding_local(entry.topic + " " + entry.content)
        except Exception:
            emb = None
        await db.add_knowledge(
            topic=entry.topic,
            content=entry.content,
            metadata={"source": req.source, **(entry.metadata or {})},
            embedding=emb,
        )
        count += 1
    return {"ingested": count, "source": req.source}


# ─────────────────────────────── Runtime Variables ───────────────────────────────

@app.get("/variables")
async def list_variables():
    items = await db.list_variables()
    return {"items": items}


@app.put("/variables/{key}")
async def set_variable(key: str, req: VariableSet):
    result = await db.set_variable(key, req.value)
    return result


@app.get("/variables/{key}")
async def get_variable(key: str):
    result = await db.get_variable(key)
    if not result:
        raise HTTPException(404, "Variable not found")
    return result


@app.delete("/variables/{key}")
async def delete_variable(key: str):
    deleted = await db.delete_variable(key)
    if not deleted:
        raise HTTPException(404, "Variable not found")
    return {"status": "deleted"}
