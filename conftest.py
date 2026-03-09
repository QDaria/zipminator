"""Root conftest for Zipminator test suite.

Ignores test directories that require external infrastructure:
- tests/mcp: requires a running MCP server context (pydantic model registration at import)
- tests/email_kms: requires Redis and conflicts with other test modules via sys.path
"""

collect_ignore_glob = [
    "tests/mcp/*",
    "tests/email_kms/*",
]
