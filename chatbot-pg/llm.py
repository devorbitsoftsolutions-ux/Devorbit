import numpy as np
from openai import OpenAI
from config import settings, runtime_config

NO_CONFIG_MESSAGE = (
    "I'm not configured yet. Please ask the site admin to set the API key "
    "in the admin panel (Settings \u2192 AI Chatbot Configuration)."
)


def _check_llm_config() -> bool:
    key = runtime_config.api_key or ""
    return bool(key) and key != "sk-your-openai-api-key-here" and key != "placeholder"


def get_client() -> OpenAI | None:
    if not _check_llm_config():
        return None
    return OpenAI(
        api_key=runtime_config.api_key,
        base_url=runtime_config.base_url,
    )


def build_system_prompt(context_chunks: list[dict]) -> str:
    lines = [
        "You are a helpful AI assistant for DevOrbit, a digital services company.",
        "Answer the user's question based on the context below and conversation history.",
        "If the context does not contain enough information, say so politely.",
        "Be concise, friendly, and accurate.",
        "",
        "=== KNOWLEDGE BASE CONTEXT ===",
    ]
    for i, chunk in enumerate(context_chunks, 1):
        lines.append(f"\n[{i}] Topic: {chunk.get('topic', 'general')}")
        lines.append(f"    {chunk.get('content', '')}")
    lines.append("\n=== END OF CONTEXT ===")
    return "\n".join(lines)


def build_history_messages(history: list[dict]) -> list[dict]:
    result = []
    for msg in history:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role in ("user", "assistant"):
            result.append({"role": role, "content": content})
    return result


def _build_direct_response(question: str, context_chunks: list[dict]) -> str:
    if not context_chunks:
        return "I couldn't find that information. Please contact us at devorbitsoftsolutions@gmail.com for assistance."

    best = context_chunks[0]
    content = best.get("content", "").strip()

    q = question.lower()

    # For open-ended or vague queries, combine top 2-3 entries into a brief summary
    vague_keywords = ["tell me about", "what about", "anything", "overview", "introduce"]
    is_vague = any(k in q for k in vague_keywords) or len([w for w in q.split() if len(w) > 2]) <= 2

    return content


async def generate_response(
    question: str,
    context_chunks: list[dict],
    history: list[dict],
) -> str:
    if not _check_llm_config():
        return NO_CONFIG_MESSAGE

    client = get_client()
    if not client:
        return NO_CONFIG_MESSAGE

    system_prompt = build_system_prompt(context_chunks)
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(build_history_messages(history))
    messages.append({"role": "user", "content": question})

    try:
        response = client.chat.completions.create(
            model=runtime_config.model,
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
        )
        return response.choices[0].message.content or ""
    except Exception:
        return _build_direct_response(question, context_chunks)


async def generate_embedding(text: str) -> list[float]:
    try:
        if _check_llm_config():
            client = get_client()
            if client:
                response = client.embeddings.create(
                    model="text-embedding-ada-002",
                    input=text,
                )
                return response.data[0].embedding
    except Exception:
        pass
    return await _generate_local_embedding(text)


async def _generate_local_embedding(text: str) -> list[float]:
    try:
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer(settings.embedding_model)
        emb = model.encode(text, normalize_embeddings=True)
        return emb.tolist()
    except ImportError:
        return [0.0] * 384


_embedding_cache: dict = {}
_embedding_model_instance = None


def get_embedding_model():
    global _embedding_model_instance
    if _embedding_model_instance is None:
        from sentence_transformers import SentenceTransformer
        _embedding_model_instance = SentenceTransformer(settings.embedding_model)
    return _embedding_model_instance


async def generate_embedding_local(text: str) -> list[float]:
    if text in _embedding_cache:
        return _embedding_cache[text]
    model = get_embedding_model()
    emb = model.encode(text, normalize_embeddings=True)
    result = emb.tolist()
    _embedding_cache[text] = result
    return result
