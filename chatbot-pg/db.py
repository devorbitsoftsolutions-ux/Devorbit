import json
import numpy as np
import asyncpg
from typing import Optional
from config import settings


class Database:
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None

    async def connect(self):
        self.pool = await asyncpg.create_pool(
            settings.database_url,
            min_size=2,
            max_size=10,
        )

    async def close(self):
        if self.pool:
            await self.pool.close()

    # --- Conversations ---

    async def create_conversation(self, user_id: str = "anonymous", title: str = "") -> dict:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "INSERT INTO conversations (user_id, title) VALUES ($1, $2) RETURNING id, user_id, title, created_at",
                user_id, title,
            )
            return dict(row)

    async def get_conversation(self, conversation_id: str) -> Optional[dict]:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT id, user_id, title, created_at, updated_at FROM conversations WHERE id = $1",
                conversation_id,
            )
            return dict(row) if row else None

    async def list_conversations(self, user_id: str = "anonymous", limit: int = 20, offset: int = 0) -> list[dict]:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT id, user_id, title, created_at, updated_at FROM conversations "
                "WHERE user_id = $1 ORDER BY updated_at DESC LIMIT $2 OFFSET $3",
                user_id, limit, offset,
            )
            return [dict(r) for r in rows]

    # --- Messages ---

    async def add_message(self, conversation_id: str, role: str, content: str) -> dict:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3) "
                "RETURNING id, conversation_id, role, content, created_at",
                conversation_id, role, content,
            )
            # Touch conversation updated_at
            await conn.execute(
                "UPDATE conversations SET updated_at = now() WHERE id = $1",
                conversation_id,
            )
            return dict(row)

    async def get_messages(self, conversation_id: str, limit: int = 50) -> list[dict]:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT id, role, content, created_at FROM messages "
                "WHERE conversation_id = $1 ORDER BY created_at ASC LIMIT $2",
                conversation_id, limit,
            )
            return [dict(r) for r in rows]

    async def get_recent_messages(self, conversation_id: str, n: int = 10) -> list[dict]:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT role, content FROM messages "
                "WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT $2",
                conversation_id, n,
            )
            return [dict(r) for r in reversed(rows)]

    # --- Knowledge Base ---

    async def add_knowledge(self, topic: str, content: str, metadata: Optional[dict] = None,
                            embedding: Optional[list[float]] = None) -> dict:
        meta_json = json.dumps(metadata or {})
        async with self.pool.acquire() as conn:
            if embedding:
                row = await conn.fetchrow(
                    "INSERT INTO knowledge_base (topic, content, metadata, embedding) "
                    "VALUES ($1, $2, $3::jsonb, $4::float8[]) RETURNING id, topic, content, metadata, created_at",
                    topic, content, meta_json, embedding,
                )
            else:
                row = await conn.fetchrow(
                    "INSERT INTO knowledge_base (topic, content, metadata) "
                    "VALUES ($1, $2, $3::jsonb) RETURNING id, topic, content, metadata, created_at",
                    topic, content, meta_json,
                )
            return dict(row)

    async def update_knowledge(self, knowledge_id: str, topic: Optional[str] = None,
                               content: Optional[str] = None, metadata: Optional[dict] = None) -> Optional[dict]:
        sets = []
        args = []
        i = 1
        if topic is not None:
            sets.append(f"topic = ${i}")
            args.append(topic)
            i += 1
        if content is not None:
            sets.append(f"content = ${i}")
            args.append(content)
            i += 1
        if metadata is not None:
            sets.append(f"metadata = ${i}::jsonb")
            args.append(json.dumps(metadata))
            i += 1
        if not sets:
            return None
        args.append(knowledge_id)
        sql = f"UPDATE knowledge_base SET {', '.join(sets)} WHERE id = ${i} RETURNING id, topic, content, metadata, created_at, updated_at"
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(sql, *args)
            return dict(row) if row else None

    async def delete_knowledge(self, knowledge_id: str) -> bool:
        async with self.pool.acquire() as conn:
            result = await conn.execute("DELETE FROM knowledge_base WHERE id = $1", knowledge_id)
            return result != "DELETE 0"

    async def delete_knowledge_by_source(self, source: str) -> int:
        async with self.pool.acquire() as conn:
            result = await conn.execute(
                "DELETE FROM knowledge_base WHERE metadata->>'source' = $1",
                source,
            )
            return int(result.split()[-1]) if result.startswith("DELETE") else 0

    async def search_knowledge(self, query: str, limit: int = 5) -> list[dict]:
        seen_ids: set[str] = set()
        result: list[dict] = []

        # Strategy 1: FTS with the whole query
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT id, topic, content, metadata, created_at FROM knowledge_base "
                "WHERE to_tsvector('english', topic || ' ' || content) @@ plainto_tsquery('english', $1) "
                "ORDER BY ts_rank(to_tsvector('english', topic || ' ' || content), plainto_tsquery('english', $1)) DESC "
                "LIMIT $2",
                query, limit,
            )
            for r in rows:
                rid = str(r["id"])
                if rid not in seen_ids:
                    seen_ids.add(rid)
                    result.append(dict(r))
            if len(result) >= limit:
                return result[:limit]

        # Strategy 2: topic-only ILIKE for individual words (>1 char, skip common filler)
        _skip = {"in", "on", "at", "to", "is", "it", "of", "by", "or", "an", "as", "be", "if", "do", "my", "up", "us", "we", "no", "ok", "go"}
        words = [w.lower() for w in query.split() if len(w) > 1 and w.lower() not in _skip]
        if words:
            async with self.pool.acquire() as conn:
                clauses = " OR ".join(f"topic ILIKE '%' || ${i+1} || '%'" for i in range(len(words)))
                rows = await conn.fetch(
                    f"SELECT id, topic, content, metadata, created_at FROM knowledge_base WHERE {clauses} LIMIT ${len(words) + 1}",
                    *words, limit,
                )
                for r in rows:
                    rid = str(r["id"])
                    if rid not in seen_ids:
                        seen_ids.add(rid)
                        result.append(dict(r))
                if len(result) >= limit:
                    return result[:limit]

        # Strategy 3: content-only ILIKE for individual words
        if words:
            async with self.pool.acquire() as conn:
                clauses = " OR ".join(f"content ILIKE '%' || ${i+1} || '%'" for i in range(len(words)))
                rows = await conn.fetch(
                    f"SELECT id, topic, content, metadata, created_at FROM knowledge_base WHERE {clauses} LIMIT ${len(words) + 1}",
                    *words, limit,
                )
                for r in rows:
                    rid = str(r["id"])
                    if rid not in seen_ids:
                        seen_ids.add(rid)
                        result.append(dict(r))
                if len(result) >= limit:
                    return result[:limit]

        # Strategy 4: fallback — ILIKE on the whole query against any field
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT id, topic, content, metadata, created_at FROM knowledge_base "
                "WHERE topic ILIKE '%' || $1 || '%' OR content ILIKE '%' || $1 || '%' "
                "LIMIT $2",
                query, limit,
            )
            for r in rows:
                rid = str(r["id"])
                if rid not in seen_ids:
                    seen_ids.add(rid)
                    result.append(dict(r))
        return result

    async def search_knowledge_vector(self, embedding: list[float], limit: int = 5,
                                      threshold: float = 0.3) -> list[dict]:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT id, topic, content, metadata, embedding FROM knowledge_base WHERE embedding IS NOT NULL"
            )
        results = []
        emb_array = np.array(embedding, dtype=np.float64)
        emb_norm = np.linalg.norm(emb_array)
        if emb_norm == 0:
            return []
        for row in rows:
            db_emb = np.array(row["embedding"], dtype=np.float64)
            db_norm = np.linalg.norm(db_emb)
            if db_norm == 0:
                continue
            similarity = float(np.dot(emb_array, db_emb) / (emb_norm * db_norm))
            if similarity >= threshold:
                results.append({
                    "id": row["id"],
                    "topic": row["topic"],
                    "content": row["content"],
                    "metadata": row["metadata"],
                    "similarity": round(similarity, 4),
                })
        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results[:limit]

    async def list_knowledge(self, topic: Optional[str] = None, limit: int = 50, offset: int = 0) -> list[dict]:
        async with self.pool.acquire() as conn:
            if topic:
                rows = await conn.fetch(
                    "SELECT id, topic, content, metadata, created_at FROM knowledge_base "
                    "WHERE topic = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
                    topic, limit, offset,
                )
            else:
                rows = await conn.fetch(
                    "SELECT id, topic, content, metadata, created_at FROM knowledge_base "
                    "ORDER BY created_at DESC LIMIT $1 OFFSET $2",
                    limit, offset,
                )
            return [dict(r) for r in rows]

    # --- Runtime Variables ---

    async def set_variable(self, key: str, value: dict | list | str | int | float | bool | None) -> dict:
        val_json = json.dumps(value)
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "INSERT INTO runtime_variables (key, value) VALUES ($1, $2::jsonb) "
                "ON CONFLICT (key) DO UPDATE SET value = $2::jsonb, updated_at = now() "
                "RETURNING key, value, updated_at",
                key, val_json,
            )
            return dict(row)

    async def get_variable(self, key: str) -> Optional[dict]:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT key, value, updated_at FROM runtime_variables WHERE key = $1",
                key,
            )
            return dict(row) if row else None

    async def delete_variable(self, key: str) -> bool:
        async with self.pool.acquire() as conn:
            result = await conn.execute("DELETE FROM runtime_variables WHERE key = $1", key)
            return result != "DELETE 0"

    async def list_variables(self) -> list[dict]:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT key, value, updated_at FROM runtime_variables ORDER BY key"
            )
            return [dict(r) for r in rows]


db = Database()
