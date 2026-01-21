"""
Code annotation patterns and phase explanations for educational display.
"""

import re
from dataclasses import dataclass
from typing import List, Dict, Any

# Pattern-based annotations that explain RLM idioms
CODE_PATTERNS = [
    {
        "regex": r"context\[.*\]|context\[:|\bcontext\b",
        "explanation": "Accessing the transcript data. RLM treats your document as a variable it can slice and analyze.",
        "importance": "key",
    },
    {
        "regex": r"llm_query\(",
        "explanation": "Calling a sub-LM (recursive call). This is where RLM delegates part of the analysis to another language model.",
        "importance": "key",
    },
    {
        "regex": r"llm_query_batched\(",
        "explanation": "Calling multiple sub-LMs in parallel. This dramatically speeds up analysis of multiple chunks.",
        "importance": "key",
    },
    {
        "regex": r"for .* in .*chunk|for .* in .*section",
        "explanation": "Iterating over chunks of the document. RLM breaks large texts into manageable pieces.",
        "importance": "context",
    },
    {
        "regex": r"buffer.*=|buffers\.append|answers\.append",
        "explanation": "Accumulating information across iterations. RLM builds up knowledge step by step.",
        "importance": "context",
    },
    {
        "regex": r"print\(",
        "explanation": "Outputting to the REPL. RLM can see this output in the next iteration to guide its reasoning.",
        "importance": "detail",
    },
    {
        "regex": r"len\(context\)|len\(",
        "explanation": "Measuring the size of data. RLM often checks lengths to decide how to chunk.",
        "importance": "detail",
    },
    {
        "regex": r"FINAL\(|FINAL_VAR\(",
        "explanation": "Signaling the final answer! This tells RLM that it has found the answer.",
        "importance": "key",
    },
]

# Phase-specific educational content
PHASE_EXPLANATIONS: Dict[str, Dict[str, str]] = {
    "exploring": {
        "icon": "magnifying_glass",
        "title": "Exploring",
        "explanation": (
            "The RLM is examining your document to understand its structure. "
            "It's figuring out how long the text is, what format it's in, and "
            "planning how to break it into chunks."
        ),
        "importance": (
            "This exploration phase is crucial. RLM can handle documents of "
            "any length by first understanding what it's working with."
        ),
    },
    "analyzing": {
        "icon": "chart_bar",
        "title": "Analyzing",
        "explanation": (
            "The RLM is breaking your document into chunks and analyzing each one. "
            "It uses sub-LMs (smaller language models) to process each chunk, "
            "extracting relevant information to answer your question."
        ),
        "importance": (
            "This is where RLM's recursive nature shines. By dividing the problem, "
            "it can handle documents that would be too large for a single LLM call."
        ),
    },
    "synthesizing": {
        "icon": "link",
        "title": "Synthesizing",
        "explanation": (
            "The RLM is combining results from different chunks. It's using buffers "
            "to accumulate findings and may query additional sub-LMs to resolve "
            "conflicts or fill gaps in the information."
        ),
        "importance": (
            "Synthesis is how RLM builds coherent understanding from fragmented "
            "analysis. It's like assembling pieces of a puzzle."
        ),
    },
    "answering": {
        "icon": "check_circle",
        "title": "Answering",
        "explanation": (
            "The RLM has gathered enough information and is formulating the final "
            "answer. It uses FINAL() or FINAL_VAR() to signal that it has completed "
            "its analysis."
        ),
        "importance": (
            "The answer emerges from the iterative process. RLM doesn't guess - "
            "it builds up to the answer through systematic analysis."
        ),
    },
}


@dataclass
class CodeAnnotation:
    """A single annotation for a line of code."""

    line: int
    pattern: str
    explanation: str
    importance: str  # 'key' | 'context' | 'detail'


class CodeAnnotator:
    """Annotates code with educational explanations."""

    def __init__(self):
        self._patterns = CODE_PATTERNS

    def annotate(self, code: str) -> List[Dict[str, Any]]:
        """
        Return annotations for code lines.

        Args:
            code: The code string to annotate

        Returns:
            List of annotation dicts with line, explanation, importance
        """
        lines = code.split("\n")
        annotations = []

        for i, line in enumerate(lines, 1):
            for pattern in self._patterns:
                if re.search(pattern["regex"], line):
                    annotations.append(
                        {
                            "line": i,
                            "explanation": pattern["explanation"],
                            "importance": pattern["importance"],
                        }
                    )
                    break  # Only one annotation per line

        return annotations

    def get_key_annotations(self, code: str) -> List[Dict[str, Any]]:
        """Return only 'key' importance annotations."""
        return [a for a in self.annotate(code) if a["importance"] == "key"]
