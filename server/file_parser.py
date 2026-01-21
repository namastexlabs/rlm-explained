"""
File parser for .txt, .md, and .pdf files.
All processing is in-memory - no server storage.
"""

import io
from typing import Tuple


def parse_file(filename: str, content: bytes) -> Tuple[str, str]:
    """
    Parse uploaded file to plain text. No storage.

    Args:
        filename: Original filename with extension
        content: Raw file bytes

    Returns:
        Tuple of (parsed_text, file_type)

    Raises:
        ValueError: If file type is not supported
    """
    # Extract extension safely
    parts = filename.lower().rsplit(".", 1)
    if len(parts) == 1:
        raise ValueError(
            f"File has no extension: {filename}. Supported extensions: .txt, .md, .pdf"
        )
    ext = parts[1]

    if ext in ("txt", "md"):
        try:
            return content.decode("utf-8"), ext
        except UnicodeDecodeError:
            # Fallback: replace invalid characters
            return content.decode("utf-8", errors="replace"), ext

    elif ext == "pdf":
        try:
            from marker.converters.pdf import PdfConverter
            from marker.models import create_model_dict
        except ImportError:
            raise ImportError(
                "marker-pdf is required for PDF parsing. Install with: pip install marker-pdf"
            )

        models = create_model_dict()
        converter = PdfConverter(artifact_dict=models)
        rendered = converter(io.BytesIO(content))
        return rendered.markdown, "pdf"

    else:
        raise ValueError(
            f"Unsupported file type: .{ext}. Supported: .txt, .md, .pdf"
        )


def get_supported_extensions() -> list[str]:
    """Return list of supported file extensions."""
    return ["txt", "md", "pdf"]
