#!/usr/bin/env python3
"""Citation discovery via OpenRouter. Finds missing references published 2024-April 2026.

Usage: python3 openrouter-lit-search.py <abstract.txt> [refs.bib]
"""
import json, os, sys
try:
    import httpx
except ImportError:
    sys.exit("Install httpx: uv pip install httpx")

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
BASE_URL = "https://openrouter.ai/api/v1/chat/completions"

SEARCH_PROMPT = """You are an academic citation expert. Given a paper abstract and its existing reference list,
identify 10-20 papers published between January 2024 and April 2026 that are MISSING.

For each suggested paper, provide:
- title (exact)
- first_author (last name, first initial)
- year
- venue (conference or journal)
- doi_or_arxiv (if known, otherwise "unknown")
- relevance (1-sentence explanation of why this paper should be cited)
- confidence: "high" (you are certain this paper exists) or "verify" (you think it exists but are not sure)

Return ONLY valid JSON array:
[
  {{"title": "...", "first_author": "...", "year": 2025, "venue": "...", "doi_or_arxiv": "...", "relevance": "...", "confidence": "high"}},
  ...
]

Abstract:
{abstract}

Existing references (first 50):
{refs}
"""

def search(abstract: str, refs: str, model: str = "qwen-3.6") -> list:
    if not OPENROUTER_API_KEY:
        sys.exit("Set OPENROUTER_API_KEY environment variable")

    models = {
        "qwen-3.6": "qwen/qwen-3.6",
        "glm-5.1": "zhipu/glm-5.1-mythos",
    }
    model_id = models.get(model, "qwen/qwen-3.6")

    response = httpx.post(
        BASE_URL,
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": model_id,
            "messages": [{"role": "user", "content": SEARCH_PROMPT.format(abstract=abstract, refs=refs[:5000])}],
            "temperature": 0.2,
            "max_tokens": 4096,
        },
        timeout=120.0,
    )
    response.raise_for_status()
    content = response.json()["choices"][0]["message"]["content"].strip()
    if content.startswith("```"):
        content = content.split("\n", 1)[1].rsplit("```", 1)[0].strip()
    return json.loads(content)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <abstract.txt> [refs.bib]")
        sys.exit(1)

    with open(sys.argv[1]) as f:
        abstract = f.read()

    refs = ""
    if len(sys.argv) > 2:
        with open(sys.argv[2]) as f:
            refs = f.read()

    results = search(abstract, refs)
    high_confidence = [r for r in results if r.get("confidence") == "high"]
    needs_verify = [r for r in results if r.get("confidence") != "high"]

    print(f"\n=== {len(high_confidence)} HIGH CONFIDENCE ===")
    for r in high_confidence:
        print(f"  {r['first_author']} ({r['year']}) \"{r['title']}\" - {r['venue']}")
        print(f"    DOI/arXiv: {r.get('doi_or_arxiv', 'unknown')}")

    print(f"\n=== {len(needs_verify)} NEEDS VERIFICATION [VERIFY] ===")
    for r in needs_verify:
        print(f"  [VERIFY] {r['first_author']} ({r['year']}) \"{r['title']}\"")
