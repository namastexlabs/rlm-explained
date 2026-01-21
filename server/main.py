"""
RLM Explained - FastAPI backend for educational RLM visualization.

Provides SSE streaming of RLM iterations with educational annotations.
No data is stored - all processing is ephemeral.
"""

import json
import os
from typing import Optional

from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from rlm import RLM
from server.file_parser import parse_file, get_supported_extensions
from server.stream_logger import StreamLogger
from server.educational import EducationalEnricher

app = FastAPI(
    title="RLM Explained API",
    description="Educational RLM visualization backend",
    version="0.1.0",
)

# CORS configuration - adjust origins for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ProcessRequest(BaseModel):
    """Request model for processing with pre-parsed transcript."""

    transcript: str
    question: str
    max_iterations: int = 10  # Default to 10, configurable by user
    backend: str = "cerebras"  # Default backend
    api_key: Optional[str] = None  # User-provided API key (not stored)


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    version: str


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(status="healthy", version="0.1.0")


@app.get("/api/supported-formats")
async def get_supported_formats():
    """Return list of supported file formats."""
    return {"formats": get_supported_extensions()}


@app.post("/api/process")
async def process_transcript(request: ProcessRequest):
    """
    Process transcript with RLM and stream iterations via SSE.

    The transcript is processed in-memory and not stored.
    Educational annotations are added to each iteration.
    """
    transcript = request.transcript
    question = request.question
    max_iterations = request.max_iterations
    backend = request.backend
    user_api_key = request.api_key  # User-provided key (not stored)

    if not transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript cannot be empty")
    if not question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    # Create streaming logger
    stream_logger = StreamLogger()
    enricher = EducationalEnricher()

    # Determine API key: use user-provided key if available, otherwise fall back to environment
    api_key = user_api_key
    if not api_key:
        # Map backend to environment variable
        env_var_map = {
            "cerebras": "CEREBRAS_API_KEY",
            "openai": "OPENAI_API_KEY",
            "anthropic": "ANTHROPIC_API_KEY",
            "gemini": "GOOGLE_API_KEY",
            "openrouter": "OPENROUTER_API_KEY",
        }
        env_var = env_var_map.get(backend, f"{backend.upper()}_API_KEY")
        api_key = os.environ.get(env_var)
        if not api_key:
            raise HTTPException(
                status_code=400,
                detail=f"API key required for {backend}. Either provide one or set {env_var} environment variable.",
            )

    # Configure backend_kwargs based on provider
    backend_kwargs: dict = {"api_key": api_key}

    # Set model names and other provider-specific settings
    if backend == "cerebras":
        backend_kwargs["model_name"] = "gpt-oss-120b"
    elif backend == "openai":
        backend_kwargs["model_name"] = "gpt-5-nano-2025-08-07"
    elif backend == "anthropic":
        backend_kwargs["model_name"] = "claude-haiku-4-5"
    elif backend == "gemini":
        backend_kwargs["model_name"] = "gemini-3-flash-preview"
    elif backend == "openrouter":
        backend_kwargs["model_name"] = "openai/gpt-5-nano"
        backend_kwargs["base_url"] = "https://openrouter.ai/api/v1"

    rlm = RLM(
        backend=backend,
        backend_kwargs=backend_kwargs,
        environment="local",
        logger=stream_logger,
        max_iterations=max_iterations,
        verbose=False,
    )

    async def generate():
        """Async generator for SSE events."""
        # Build context for RLM
        context = transcript

        try:
            for iteration_json in stream_logger.stream_iterations(
                rlm.completion,
                context,
                question,
            ):
                data = json.loads(iteration_json)
                event_type = data.get("type")

                # Pass through token events immediately for real-time streaming
                if event_type == "token":
                    yield f"data: {iteration_json}\n\n"

                # Pass through code execution results
                elif event_type == "code_result":
                    yield f"data: {iteration_json}\n\n"

                # Enrich iterations with educational content
                elif event_type == "iteration":
                    enriched = enricher.enrich(data)
                    yield f"data: {json.dumps(enriched.to_dict())}\n\n"

                elif event_type == "metadata":
                    yield f"data: {iteration_json}\n\n"

                elif event_type == "error":
                    yield f"data: {iteration_json}\n\n"

            # Send completion event
            yield f'data: {{"type": "complete"}}\n\n'

        except Exception as e:
            error_data = {"type": "error", "error": str(e)}
            yield f"data: {json.dumps(error_data)}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
            "Connection": "keep-alive",
        },
    )


@app.post("/api/process-file")
async def process_file(
    file: UploadFile = File(...),
    question: str = Form(...),
):
    """
    Upload file, parse it, and process with RLM.

    Supports .txt, .md, and .pdf files.
    File content is processed in-memory and not stored.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Read file content
    content = await file.read()

    try:
        transcript, file_type = parse_file(file.filename, content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ImportError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Delegate to process_transcript
    request = ProcessRequest(transcript=transcript, question=question)
    return await process_transcript(request)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "server.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
