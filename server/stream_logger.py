"""
Streaming logger that yields iterations via queue instead of writing to file.
Enables SSE streaming of RLM execution to frontend.
"""

import json
import queue
import threading
from datetime import datetime
from typing import Generator, Callable, Any

from rlm.core.types import RLMIteration, RLMMetadata


class StreamLogger:
    """
    Logger that streams iterations instead of writing to file.
    Used by FastAPI to send SSE events to the frontend.
    """

    def __init__(self):
        self._iteration_count = 0
        self._metadata_logged = False
        self._queue: queue.Queue[str | None] = queue.Queue()
        self._metadata: RLMMetadata | None = None

    def log_metadata(self, metadata: RLMMetadata) -> None:
        """Stream metadata as first event."""
        if self._metadata_logged:
            return

        self._metadata = metadata
        entry = {
            "type": "metadata",
            "timestamp": datetime.now().isoformat(),
            **metadata.to_dict(),
        }
        self._queue.put(json.dumps(entry))
        self._metadata_logged = True

    def log(self, iteration: RLMIteration) -> None:
        """Stream iteration as event."""
        self._iteration_count += 1

        entry = {
            "type": "iteration",
            "iteration": self._iteration_count,
            "timestamp": datetime.now().isoformat(),
            **iteration.to_dict(),
        }
        self._queue.put(json.dumps(entry))

    def log_token(self, token: str, iteration: int) -> None:
        """Stream a single token for real-time display."""
        entry = {
            "type": "token",
            "iteration": iteration,
            "content": token,
        }
        self._queue.put(json.dumps(entry))

    def log_code_result(self, iteration: int, code: str, result: dict) -> None:
        """Stream code execution result immediately after execution."""
        entry = {
            "type": "code_result",
            "iteration": iteration,
            "code": code,
            "result": result,
        }
        self._queue.put(json.dumps(entry))

    def signal_complete(self) -> None:
        """Signal that processing is complete."""
        self._queue.put(None)

    def stream_iterations(
        self,
        completion_fn: Callable[..., Any],
        context: Any,
        root_prompt: str,
    ) -> Generator[str, None, None]:
        """
        Run completion in thread, yield iterations from queue.

        Args:
            completion_fn: The RLM.completion function to call
            context: The context to pass to completion
            root_prompt: The root prompt (question) to answer

        Yields:
            JSON strings for each iteration event
        """

        def run_completion():
            try:
                completion_fn(context, root_prompt=root_prompt)
            except Exception as e:
                # Stream error event
                error_entry = {
                    "type": "error",
                    "timestamp": datetime.now().isoformat(),
                    "error": str(e),
                }
                self._queue.put(json.dumps(error_entry))
            finally:
                self.signal_complete()

        thread = threading.Thread(target=run_completion)
        thread.start()

        while True:
            item = self._queue.get()
            if item is None:
                break
            yield item

        thread.join()
