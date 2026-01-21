"""
Cerebras client with native streaming support.

Uses the official Cerebras Cloud SDK for real-time token delivery.
"""

import os
from collections import defaultdict
from typing import Any, Generator

from cerebras.cloud.sdk import Cerebras
from dotenv import load_dotenv

from rlm.clients.base_lm import BaseLM
from rlm.core.types import ModelUsageSummary, UsageSummary

load_dotenv()

DEFAULT_CEREBRAS_API_KEY = os.getenv("CEREBRAS_API_KEY")


class CerebrasClient(BaseLM):
    """
    LM Client for Cerebras using the native Cerebras Cloud SDK with streaming support.

    Provides both synchronous and streaming completions for real-time token delivery.
    """

    def __init__(
        self,
        api_key: str | None = None,
        model_name: str | None = None,
        **kwargs,
    ):
        super().__init__(model_name=model_name, **kwargs)

        self.client = Cerebras(api_key=api_key or DEFAULT_CEREBRAS_API_KEY)
        self.model_name = model_name

        # Per-model usage tracking
        self.model_call_counts: dict[str, int] = defaultdict(int)
        self.model_input_tokens: dict[str, int] = defaultdict(int)
        self.model_output_tokens: dict[str, int] = defaultdict(int)

        # Last call tracking
        self.last_prompt_tokens = 0
        self.last_completion_tokens = 0

    def _prepare_messages(self, prompt: str | list[dict[str, Any]]) -> list[dict]:
        """Convert prompt to message format."""
        if isinstance(prompt, str):
            return [{"role": "user", "content": prompt}]
        elif isinstance(prompt, list) and all(isinstance(item, dict) for item in prompt):
            return prompt
        else:
            raise ValueError(f"Invalid prompt type: {type(prompt)}")

    def completion(self, prompt: str | list[dict[str, Any]], model: str | None = None) -> str:
        """Non-streaming completion (for backwards compatibility)."""
        messages = self._prepare_messages(prompt)
        model = model or self.model_name

        if not model:
            raise ValueError("Model name is required for Cerebras client.")

        response = self.client.chat.completions.create(
            model=model,
            messages=messages,
        )

        self._track_usage(response, model)
        return response.choices[0].message.content

    def stream_completion(
        self, prompt: str | list[dict[str, Any]], model: str | None = None
    ) -> Generator[str, None, str]:
        """
        Streaming completion - yields tokens as they arrive.

        Yields individual tokens (or small chunks) as they are generated.
        Returns the full accumulated response at the end.

        Usage:
            for token in client.stream_completion(prompt):
                print(token, end='', flush=True)
        """
        messages = self._prepare_messages(prompt)
        model = model or self.model_name

        if not model:
            raise ValueError("Model name is required for Cerebras client.")

        stream = self.client.chat.completions.create(
            model=model,
            messages=messages,
            stream=True,
        )

        full_response = ""
        for chunk in stream:
            token = chunk.choices[0].delta.content or ""
            if token:
                full_response += token
                yield token

        # Track approximate usage for streaming (exact tokens not always available)
        self._track_usage_streaming(model, full_response)

        return full_response

    async def acompletion(
        self, prompt: str | list[dict[str, Any]], model: str | None = None
    ) -> str:
        """Async non-streaming completion (falls back to sync for now)."""
        # Cerebras SDK doesn't have async client yet, use sync
        return self.completion(prompt, model)

    def _track_usage(self, response, model: str):
        """Track usage from non-streaming response."""
        self.model_call_counts[model] += 1

        usage = getattr(response, "usage", None)
        if usage:
            self.model_input_tokens[model] += usage.prompt_tokens
            self.model_output_tokens[model] += usage.completion_tokens
            self.last_prompt_tokens = usage.prompt_tokens
            self.last_completion_tokens = usage.completion_tokens

    def _track_usage_streaming(self, model: str, full_response: str):
        """Track approximate usage for streaming (tokens not always available in stream)."""
        self.model_call_counts[model] += 1
        # Approximate: 1 token ≈ 4 chars (rough estimate for English text)
        approx_tokens = len(full_response) // 4
        self.model_output_tokens[model] += approx_tokens
        self.last_completion_tokens = approx_tokens
        # Input tokens not available in streaming mode, keep previous value

    def get_usage_summary(self) -> UsageSummary:
        """Get cumulative usage summary for all models."""
        model_summaries = {}
        for model in self.model_call_counts:
            model_summaries[model] = ModelUsageSummary(
                total_calls=self.model_call_counts[model],
                total_input_tokens=self.model_input_tokens[model],
                total_output_tokens=self.model_output_tokens[model],
            )
        return UsageSummary(model_usage_summaries=model_summaries)

    def get_last_usage(self) -> ModelUsageSummary:
        """Get usage from the last completion call."""
        return ModelUsageSummary(
            total_calls=1,
            total_input_tokens=self.last_prompt_tokens,
            total_output_tokens=self.last_completion_tokens,
        )
