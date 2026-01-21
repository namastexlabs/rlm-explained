"""
Educational content enricher for RLM iterations.
Adds explanations and annotations without modifying core data.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from .annotations import CodeAnnotator, PHASE_EXPLANATIONS


@dataclass
class EnrichedIteration:
    """Iteration with educational annotations."""

    # Original data
    iteration_number: int
    response: str
    code_blocks: List[Dict[str, Any]]
    final_answer: Optional[str]
    iteration_time: float

    # Educational additions
    phase: str
    phase_info: Dict[str, str]
    what_happened: str
    code_annotations: List[Dict[str, Any]] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to JSON-serializable dict for SSE."""
        return {
            "type": "iteration",
            "iterationNumber": self.iteration_number,
            "response": self.response,
            "codeBlocks": self.code_blocks,
            "finalAnswer": self.final_answer,
            "iterationTime": self.iteration_time,
            "education": {
                "phase": self.phase,
                "phaseIcon": self.phase_info.get("icon", ""),
                "phaseTitle": self.phase_info.get("title", ""),
                "phaseExplanation": self.phase_info.get("explanation", ""),
                "phaseImportance": self.phase_info.get("importance", ""),
                "whatHappened": self.what_happened,
                "codeAnnotations": self.code_annotations,
            },
        }


class EducationalEnricher:
    """
    Adds educational context to RLM iterations.
    Does not modify iteration data - only augments.
    """

    def __init__(self):
        self._annotator = CodeAnnotator()

    def enrich(self, iteration_data: Dict[str, Any]) -> EnrichedIteration:
        """
        Enrich a raw iteration dict with educational content.

        Args:
            iteration_data: Raw iteration dict from RLMIteration.to_dict()

        Returns:
            EnrichedIteration with educational annotations
        """
        # Extract fields
        iteration_number = iteration_data.get("iteration", 0)
        response = iteration_data.get("response", "")
        raw_code_blocks = iteration_data.get("code_blocks", [])
        final_answer = iteration_data.get("final_answer")
        iteration_time = iteration_data.get("iteration_time", 0) or 0

        # Handle tuple final_answer format
        if isinstance(final_answer, (list, tuple)) and len(final_answer) == 2:
            final_answer = final_answer[1]

        # Detect phase
        phase = self._detect_phase(response, raw_code_blocks, final_answer)
        phase_info = PHASE_EXPLANATIONS.get(phase, {})

        # Process code blocks with annotations
        code_blocks = []
        all_annotations = []
        for block in raw_code_blocks:
            code = block.get("code", "")
            result = block.get("result", {})
            annotations = self._annotator.annotate(code)
            all_annotations.extend(annotations)

            code_blocks.append(
                {
                    "code": code,
                    "stdout": result.get("stdout", ""),
                    "stderr": result.get("stderr", ""),
                    "locals": result.get("locals", {}),
                    "executionTime": result.get("execution_time", 0),
                    "subLmCalls": result.get("rlm_calls", []),
                    "annotations": annotations,
                }
            )

        # Generate summary
        what_happened = self._summarize(
            iteration_number, code_blocks, final_answer
        )

        return EnrichedIteration(
            iteration_number=iteration_number,
            response=response,
            code_blocks=code_blocks,
            final_answer=final_answer,
            iteration_time=iteration_time,
            phase=phase,
            phase_info=phase_info,
            what_happened=what_happened,
            code_annotations=all_annotations,
        )

    def _detect_phase(
        self,
        response: str,
        code_blocks: List[Dict],
        final_answer: Optional[str],
    ) -> str:
        """Detect current RLM phase from iteration content."""
        response_lower = response.lower()

        if final_answer:
            return "answering"

        # Check code patterns
        has_llm_query = any(
            "llm_query" in block.get("code", "") for block in code_blocks
        )
        has_buffer = any(
            "buffer" in block.get("code", "") or "answer" in block.get("code", "")
            for block in code_blocks
        )

        if has_llm_query and has_buffer:
            return "synthesizing"
        if has_llm_query:
            return "analyzing"
        if "chunk" in response_lower or "split" in response_lower:
            return "analyzing"

        return "exploring"

    def _summarize(
        self,
        iteration_number: int,
        code_blocks: List[Dict],
        final_answer: Optional[str],
    ) -> str:
        """Generate plain English summary of what happened."""
        sub_calls = sum(len(b.get("subLmCalls", [])) for b in code_blocks)

        if final_answer:
            return "RLM found the answer after analyzing the document."

        if sub_calls > 0:
            return f"RLM called {sub_calls} sub-LM(s) to analyze parts of the document."

        if code_blocks:
            return f"RLM wrote {len(code_blocks)} code block(s) to explore the document."

        return "RLM is thinking about how to approach the question."
