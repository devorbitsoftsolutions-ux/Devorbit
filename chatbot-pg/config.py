import os
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@localhost:5432/chatbot"
    openai_api_key: str = "sk-placeholder"
    openai_model: str = "gpt-4o-mini"
    openai_base_url: str = "https://api.openai.com/v1"
    llm_base_url: Optional[str] = None
    llm_api_key: Optional[str] = None
    llm_model: Optional[str] = None
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    host: str = "0.0.0.0"
    port: int = 8001
    max_history_messages: int = 10
    max_knowledge_results: int = 5
    similarity_threshold: float = 0.3

    @property
    def effective_llm_base_url(self) -> str:
        return self.llm_base_url or self.openai_base_url

    @property
    def effective_llm_api_key(self) -> str:
        return self.llm_api_key or self.openai_api_key

    @property
    def effective_llm_model(self) -> str:
        return self.llm_model or self.openai_model

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()


class RuntimeConfig:
    def __init__(self):
        self._api_key: str = settings.effective_llm_api_key
        self._base_url: str = settings.effective_llm_base_url
        self._model: str = settings.effective_llm_model
        self._express_url: str = os.environ.get("EXPRESS_URL", "http://localhost:3000")
        self._version: int = 0

    @property
    def api_key(self) -> str:
        return self._api_key

    @property
    def base_url(self) -> str:
        return self._base_url

    @property
    def model(self) -> str:
        return self._model

    @property
    def version(self) -> int:
        return self._version

    async def fetch_from_express(self) -> bool:
        try:
            import asyncio
            import json
            import urllib.request
            url = f"{self._express_url}/api/settings/chatbot-config/internal"
            resp = await asyncio.get_event_loop().run_in_executor(
                None, lambda: urllib.request.urlopen(urllib.request.Request(url), timeout=5)
            )
            if resp.status == 200:
                data = json.loads(resp.read().decode())
                changed = False
                if data.get("chatbotApiKey"):
                    self._api_key = data["chatbotApiKey"]
                    changed = True
                if data.get("chatbotBaseUrl"):
                    self._base_url = data["chatbotBaseUrl"]
                    changed = True
                if data.get("chatbotModel"):
                    self._model = data["chatbotModel"]
                    changed = True
                if changed:
                    self._version += 1
                return changed
        except Exception:
            pass
        return False


runtime_config = RuntimeConfig()
