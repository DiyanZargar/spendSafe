import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_agent_create_expense_conversationally(client: AsyncClient, test_user_token: str):
    """Test creating an expense through conversational agent input."""
    headers = {"Authorization": f"Bearer {test_user_token}"}

    # Say: "I spent 450 on dinner"
    chat_resp = await client.post(
        "/api/v1/conversations/chat",
        json={"message": "I spent 450 on dinner"},
        headers=headers
    )
    assert chat_resp.status_code == 200
    reply = chat_resp.json()["reply"]
    assert "Recorded expense" in reply or "450" in reply

    # Verify expense was actually saved in database via REST API
    expenses_resp = await client.get("/api/v1/expenses", headers=headers)
    assert expenses_resp.status_code == 200
    items = expenses_resp.json()["items"]
    assert any(float(i["amount"]) == 450.0 and "Food" in i["category"] for i in items)


@pytest.mark.asyncio
async def test_agent_query_today_spending(client: AsyncClient, test_user_token: str):
    """Test querying today's spending from agent."""
    headers = {"Authorization": f"Bearer {test_user_token}"}

    # Create an expense first
    await client.post(
        "/api/v1/conversations/chat",
        json={"message": "Spent 120 on Uber"},
        headers=headers
    )

    # Ask: "What did I spend today?"
    chat_resp = await client.post(
        "/api/v1/conversations/chat",
        json={"message": "What did I spend today?"},
        headers=headers
    )
    assert chat_resp.status_code == 200
    reply = chat_resp.json()["reply"]
    assert "Today you have spent" in reply or "120" in reply


@pytest.mark.asyncio
async def test_agent_report_generation(client: AsyncClient, test_user_token: str):
    """Test generating a monthly report through conversational command."""
    headers = {"Authorization": f"Bearer {test_user_token}"}

    # Ask: "Give me September report"
    chat_resp = await client.post(
        "/api/v1/conversations/chat",
        json={"message": "Give me September report"},
        headers=headers
    )
    assert chat_resp.status_code == 200
    reply = chat_resp.json()["reply"]
    assert "Report" in reply
    assert "Visual Report PNG generated" in reply or "Total Spending" in reply


@pytest.mark.asyncio
async def test_agent_delete_expense_conversationally(client: AsyncClient, test_user_token: str):
    """Test deleting an expense through conversational command."""
    headers = {"Authorization": f"Bearer {test_user_token}"}

    # Create unique expense: "Spent 850 on Starbucks"
    await client.post(
        "/api/v1/conversations/chat",
        json={"message": "Spent 850 on Starbucks"},
        headers=headers
    )

    # Delete command: "Delete the Starbucks expense"
    del_resp = await client.post(
        "/api/v1/conversations/chat",
        json={"message": "Delete the Starbucks expense"},
        headers=headers
    )
    assert del_resp.status_code == 200
    reply = del_resp.json()["reply"]
    assert "Deleted" in reply and "Starbucks" in reply

    # Verify no longer in database
    list_resp = await client.get("/api/v1/expenses", headers=headers)
    items = list_resp.json()["items"]
    assert not any(i.get("merchant") == "Starbucks" for i in items)


@pytest.mark.asyncio
async def test_user_llm_configuration_and_curl_fetch(client: AsyncClient, test_user_token: str):
    """Test user LLM UI configuration, Fernet encryption at rest, masking, and curl execution."""
    headers = {"Authorization": f"Bearer {test_user_token}"}

    # 1. Initial check - not configured
    cfg_resp = await client.get("/api/v1/llm/config", headers=headers)
    assert cfg_resp.status_code == 200
    assert cfg_resp.json()["configured"] is False

    # 2. Save LLM config with key (e.g. OpenAI provider)
    put_resp = await client.put(
        "/api/v1/llm/config",
        json={
            "provider": "openai",
            "model": "gpt-4o",
            "api_key": "sk-proj-test1234567890abcdefghijklmnopqrstuvwxyz",
            "base_url": "https://api.openai.com/v1"
        },
        headers=headers
    )
    assert put_resp.status_code == 200
    data = put_resp.json()
    assert data["configured"] is True
    assert data["provider"] == "openai"
    assert data["model"] == "gpt-4o"
    # Ensure key is masked and not returned in cleartext
    assert data["masked_api_key"] is not None
    assert "sk-p" in data["masked_api_key"]
    assert "sk-proj-test1234567890abcdefghijklmnopqrstuvwxyz" != data["masked_api_key"]

    # 3. Test curl fetch command execution (e.g. against custom/ollama or mock endpoint)
    fetch_resp = await client.post(
        "/api/v1/llm/fetch-models",
        json={
            "provider": "ollama",
            "base_url": "http://127.0.0.1:11434"
        },
        headers=headers
    )
    assert fetch_resp.status_code == 200
    fetch_data = fetch_resp.json()
    assert "curl" in fetch_data["curl_command"]
    assert "http://127.0.0.1:11434/api/tags" in fetch_data["curl_command"]

    # 4. Remove LLM configuration
    del_resp = await client.delete("/api/v1/llm/config", headers=headers)
    assert del_resp.status_code == 204

    # 5. Check reverted
    cfg_after = await client.get("/api/v1/llm/config", headers=headers)
    assert cfg_after.json()["configured"] is False
