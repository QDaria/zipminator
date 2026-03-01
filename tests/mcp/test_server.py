import pytest
from unittest.mock import MagicMock, patch
import json
import os
import sys
from pathlib import Path

# Add src to path
sys.path.append(str(Path(__file__).parent.parent.parent / "src"))

import asyncio

# We will test the tools directly or via the FastMCP instance if possible
from zipminator.mcp_server import mcp

def test_mcp_anonymize_tool_exists():
    """Verify that the anonymize tool is registered in the MCP server."""
    # FastMCP list_tools is a coroutine
    tools = asyncio.run(mcp.list_tools())
    tool_names = [tool.name for tool in tools]
    assert "anonymize_data" in tool_names
    assert "get_quantum_entropy" in tool_names
    assert "generate_pqc_keypair" in tool_names

@patch("zipminator.crypto.quantum_random.get_stats")
def test_get_quantum_entropy_tool(mock_stats):
    """Test the get_quantum_entropy tool logic."""
    from zipminator.mcp_server import get_quantum_entropy
    
    # Mock the entropy provider
    with patch("zipminator.crypto.quantum_random.randbytes") as mock_rand:
        mock_rand.return_value = bytes.fromhex("cafe")
        
        result = get_quantum_entropy(bits=16)
        assert result == "cafe"
        mock_rand.assert_called_with(2)

def test_anonymize_tool_integration():
    """Test the anonymization tool integration in MCP."""
    from zipminator.mcp_server import anonymize_data
    import pandas as pd
    
    data = [{"id": 1, "name": "John"}]
    level_map = {"name": 3} # Static Masking
    
    result_json = anonymize_data(json.dumps(data), json.dumps(level_map))
    result = json.loads(result_json)
    
    assert result[0]["name"] == "[REDACTED]"
    assert result[0]["id"] == 1
