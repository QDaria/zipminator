#!/usr/bin/env python3
"""Multi-model adversarial paper review via OpenRouter API.

Usage: python3 openrouter-review.py <section.tex> [model-name]
Models: gpt-5.4, gemini-3.1, grok-4, deepseek-r1, qwen-3.6, glm-5.1
"""
import json, os, sys
try:
    import httpx
except ImportError:
    sys.exit("Install httpx: uv pip install httpx")

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
BASE_URL = "https://openrouter.ai/api/v1/chat/completions"

MODELS = {
    "gpt-5.4": "openai/gpt-5.4",
    "gemini-3.1": "google/gemini-3.1-pro-preview",
    "grok-4": "xai/grok-4",
    "deepseek-r1": "deepseek/deepseek-r1",
    "qwen-3.6": "qwen/qwen-3.6",
    "glm-5.1": "zhipu/glm-5.1-mythos",
}

REVIEW_PROMPT = """You are a hostile Reviewer 2 at a top-tier academic venue (IEEE S&P, ACM WiSec, or PoPETs).
Your job is to find every flaw, gap, and weakness in this paper section.

Score it on a scale of 0.0 to 1.0 across these dimensions:
- Technical correctness
- Novelty and contribution
- Clarity and presentation
- Experimental rigor
- Completeness of related work

Return ONLY valid JSON in this exact format:
{
  "overall_score": 0.XX,
  "dimension_scores": {"correctness": 0.XX, "novelty": 0.XX, "clarity": 0.XX, "rigor": 0.XX, "related_work": 0.XX},
  "critical_issues": ["issue1", "issue2"],
  "major_issues": ["issue1", "issue2"],
  "minor_issues": ["issue1", "issue2"],
  "missing_citations": ["description of missing related work"],
  "verdict": "accept/revise/reject"
}

Paper section to review:
"""

def review(section: str, model: str = "gpt-5.4") -> dict:
    if not OPENROUTER_API_KEY:
        sys.exit("Set OPENROUTER_API_KEY environment variable")
    if model not in MODELS:
        sys.exit(f"Unknown model: {model}. Available: {', '.join(MODELS.keys())}")

    response = httpx.post(
        BASE_URL,
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://zipminator.zip",
            "X-Title": "Zipminator Paper Review",
        },
        json={
            "model": MODELS[model],
            "messages": [
                {"role": "system", "content": "You are a rigorous academic peer reviewer. Return only valid JSON."},
                {"role": "user", "content": REVIEW_PROMPT + section},
            ],
            "temperature": 0.3,
            "max_tokens": 4096,
        },
        timeout=120.0,
    )
    response.raise_for_status()
    content = response.json()["choices"][0]["message"]["content"]

    # Try to parse as JSON; if model wraps in markdown, strip it
    content = content.strip()
    if content.startswith("```"):
        content = content.split("\n", 1)[1].rsplit("```", 1)[0].strip()

    return json.loads(content)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <section.tex> [model]")
        print(f"Models: {', '.join(MODELS.keys())}")
        sys.exit(1)

    section_path = sys.argv[1]
    model = sys.argv[2] if len(sys.argv) > 2 else "gpt-5.4"

    with open(section_path) as f:
        section = f.read()

    print(f"Reviewing with {model} ({MODELS.get(model, '?')})...")
    result = review(section, model)
    print(json.dumps(result, indent=2))
