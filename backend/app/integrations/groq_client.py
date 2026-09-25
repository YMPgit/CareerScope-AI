"""Thin wrapper around the LLM SDK so the provider can be swapped later."""
from __future__ import annotations

import json
import re

from groq import Groq
from groq import AsyncGroq

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("groq")

# Candidate chat models tried in order when the configured model is unavailable.
MODEL_FALLBACKS = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
]


class GroqError(Exception):
    """Raised when the LLM service cannot be used or returns invalid output."""


class GroqClient:
    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
    ) -> None:
        self.api_key = api_key or settings.GROQ_API_KEY
        self.model = model or settings.GROQ_MODEL
        if not self.api_key:
            raise GroqError(
                "The AI analysis service is not configured. Add GROQ_API_KEY to your .env file."
            )
        self._client = Groq(api_key=self.api_key)
        self._async_client = AsyncGroq(api_key=self.api_key)

    @property
    def sync(self) -> Groq:
        return self._client

    @property
    def async_client(self) -> AsyncGroq:
        return self._async_client

    def _complete(self, messages: list[dict], json_mode: bool, temperature: float, max_tokens: int) -> str:
        kwargs: dict = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        candidates = [self.model] + [m for m in MODEL_FALLBACKS if m != self.model]
        for model in candidates:
            try:
                resp = self._client.chat.completions.create(model=model, **{k: v for k, v in kwargs.items() if k != "model"})
                if model != self.model:
                    logger.warning("Switched LLM model from %s to %s", self.model, model)
                    self.model = model
                return (resp.choices[0].message.content or "").strip()
            except Exception as exc:  # noqa: BLE001
                if not _is_model_unavailable(str(exc)):
                    logger.warning("LLM API error: %s", exc)
                    raise GroqError(_friendly_error(str(exc)))
                logger.warning("LLM model %s unavailable: %s", model, exc)
        raise GroqError("The AI analysis service could not start an analysis session. Please try again later.")

    def chat(self, system: str, user: str, temperature: float = 0.3, max_tokens: int = 4096) -> str:
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ]
        return self._complete(messages, json_mode=False, temperature=temperature, max_tokens=max_tokens)

    def chat_json(self, system: str, user: str, temperature: float = 0.2, max_tokens: int = 4096) -> dict:
        messages = [
            {"role": "system", "content": system + "\nReturn ONLY valid JSON. No markdown fences."},
            {"role": "user", "content": user},
        ]
        raw = self._complete(messages, json_mode=True, temperature=temperature, max_tokens=max_tokens)
        return extract_json(raw)


def _is_model_unavailable(raw: str) -> bool:
    lowered = raw.lower()
    return "model not found" in lowered or "does not exist" in lowered or "model_not_found" in lowered


def extract_json(text: str) -> dict:
    """Robustly parse a JSON object out of a possibly noisy LLM response."""
    if not text:
        raise GroqError("The AI assistant produced an empty response.")
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    codeblock = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if codeblock:
        try:
            return json.loads(codeblock.group(1))
        except json.JSONDecodeError:
            pass

    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            pass

    raise GroqError("The AI assistant returned an unexpected response.")


def _friendly_error(raw: str) -> str:
    lowered = raw.lower()
    if "invalid api key" in lowered or "api key" in lowered:
        return "The AI analysis service rejected the access key. Please check your configuration."
    if "rate limit" in lowered or "429" in lowered:
        return "The analysis service is busy. Please wait a moment and try again."
    if "insufficient quota" in lowered:
        return "The analysis service is temporarily out of capacity. Please try again later."
    if _is_model_unavailable(raw):
        return "The AI analysis service could not start an analysis session. Please try again later."
    return "The AI analysis service hit a temporary issue. Please try again."