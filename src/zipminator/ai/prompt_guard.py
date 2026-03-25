"""Prompt injection guard for Zipminator Q-AI assistant (Pillar 6).

Scans user prompts for 18 known injection patterns across 6 categories.
All patterns are case-insensitive regex.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import List, Tuple

# Each entry: (compiled regex, category label)
_PATTERNS: List[Tuple[re.Pattern, str]] = []


def _p(pattern: str, category: str) -> None:
    """Register a case-insensitive pattern."""
    _PATTERNS.append((re.compile(pattern, re.IGNORECASE), category))


# -- 1. System prompt override (3) --
_p(r"ignore\s+previous\s+instructions", "system_prompt_override")
_p(r"you\s+are\s+now\b", "system_prompt_override")
_p(r"forget\s+your\s+instructions", "system_prompt_override")

# -- 2. Role hijacking (3) --
_p(r"\bact\s+as\b", "role_hijacking")
_p(r"pretend\s+you\s+are", "role_hijacking")
_p(r"\byou\s+are\s+a\b", "role_hijacking")

# -- 3. Delimiter injection (3) --
_p(r"```\s*system", "delimiter_injection")
_p(r"###\s*SYSTEM", "delimiter_injection")
_p(r"\[INST\]", "delimiter_injection")

# -- 4. Data extraction (3) --
_p(r"reveal\s+your\s+prompt", "data_extraction")
_p(r"show\s+system\s+message", "data_extraction")
_p(r"what\s+are\s+your\s+instructions", "data_extraction")

# -- 5. Encoding bypass (3) --
_p(r"\bbase64\s*:", "encoding_bypass")
_p(r"\bhex\s*:", "encoding_bypass")
_p(r"\brot13\s*:", "encoding_bypass")

# -- 6. Recursive injection (3) --
_p(r"repeat\s+after\s+me", "recursive_injection")
_p(r"say\s+exactly", "recursive_injection")
_p(r"output\s+the\s+following", "recursive_injection")


@dataclass
class ScanResult:
    """Result of a prompt injection scan."""

    is_safe: bool
    matched_patterns: List[str] = field(default_factory=list)
    risk_score: float = 0.0


class PromptGuard:
    """Scans prompts for injection attacks before forwarding to an LLM."""

    # One point per pattern match, normalised to [0, 1].
    _MAX_SCORE = float(len(_PATTERNS))

    def scan(self, prompt: str) -> ScanResult:
        """Scan *prompt* and return a :class:`ScanResult`.

        ``is_safe`` is ``True`` when no patterns match.
        ``risk_score`` is in [0.0, 1.0], proportional to the number of
        distinct *categories* matched.
        """
        if not prompt:
            return ScanResult(is_safe=True)

        matched_categories: list[str] = []
        for regex, category in _PATTERNS:
            if regex.search(prompt):
                if category not in matched_categories:
                    matched_categories.append(category)

        if not matched_categories:
            return ScanResult(is_safe=True)

        risk = len(matched_categories) / len(
            {cat for _, cat in _PATTERNS}
        )  # fraction of categories hit

        return ScanResult(
            is_safe=False,
            matched_patterns=matched_categories,
            risk_score=round(min(risk, 1.0), 4),
        )
