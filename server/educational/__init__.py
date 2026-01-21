"""
Educational layer for RLM Explained.
Provides annotations and explanations for RLM iterations.
"""

from .enricher import EducationalEnricher, EnrichedIteration
from .annotations import CodeAnnotator, PHASE_EXPLANATIONS

__all__ = [
    "EducationalEnricher",
    "EnrichedIteration",
    "CodeAnnotator",
    "PHASE_EXPLANATIONS",
]
