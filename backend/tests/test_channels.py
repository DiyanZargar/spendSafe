import pytest
from httpx import AsyncClient
from app.channels import BaseChannel, WebChannel, TelegramChannel, WhatsAppChannel, SlackChannel, ChannelManager


@pytest.mark.asyncio
async def test_channel_adapters_contract():
    """Verify all channel adapters adhere strictly to the BaseChannel contract."""
    channels = [WebChannel(), TelegramChannel(), WhatsAppChannel(), SlackChannel()]
    for ch in channels:
        assert isinstance(ch, BaseChannel)
        # Verify interface methods exist and are callable
        assert hasattr(ch, "send_message")
        assert hasattr(ch, "send_image")
        assert hasattr(ch, "parse_incoming")
        assert hasattr(ch, "validate_credentials")
        assert hasattr(ch, "connect")
        assert hasattr(ch, "disconnect")


@pytest.mark.asyncio
async def test_channel_manager_parse_incoming():
    """Verify ChannelManager parses payloads for each channel provider."""
    mgr = ChannelManager()

    # Web payload
    web_parsed = await mgr.parse_incoming("web", {"sender_id": "user123", "text": "Spent 50 on lunch"})
    assert web_parsed.sender_id == "user123"
    assert web_parsed.text == "Spent 50 on lunch"

    # Telegram payload
    tg_payload = {
        "update_id": 1001,
        "message": {
            "chat": {"id": 987654321},
            "from": {"id": 987654321, "first_name": "John"},
            "text": "I spent 450 on dinner"
        }
    }
    tg_parsed = await mgr.parse_incoming("telegram", tg_payload)
    assert tg_parsed.sender_id == "987654321"
    assert tg_parsed.text == "I spent 450 on dinner"

    # WhatsApp (Twilio) payload
    twilio_payload = {
        "From": "whatsapp:+15551234567",
        "Body": "What did I spend today?"
    }
    wa_parsed = await mgr.parse_incoming("whatsapp", twilio_payload)
    assert wa_parsed.sender_id == "+15551234567"
    assert wa_parsed.text == "What did I spend today?"


@pytest.mark.asyncio
async def test_channel_connect_and_webhook_flow(client: AsyncClient, test_user_token: str):
    """Test connecting a channel, receiving a webhook, and resolving user identity."""
    headers = {"Authorization": f"Bearer {test_user_token}"}

    # 1. Connect Telegram channel
    connect_resp = await client.post(
        "/api/v1/channels/connect",
        json={
            "channel_type": "telegram",
            "external_identifier": "tg_user_8888",
            "credentials": {"bot_token": "mock-token-123"},
        },
        headers=headers
    )
    assert connect_resp.status_code == 201
    assert connect_resp.json()["channel_type"] == "telegram"
    assert connect_resp.json()["external_identifier"] == "tg_user_8888"

    # 2. Simulate incoming Telegram webhook from linked user
    webhook_payload = {
        "message": {
            "chat": {"id": "tg_user_8888"},
            "from": {"id": "tg_user_8888"},
            "text": "Spent 300 on groceries"
        }
    }
    wh_resp = await client.post("/api/v1/channels/webhook/telegram", json=webhook_payload)
    assert wh_resp.status_code == 200
    assert wh_resp.json()["status"] == "success"

    # 3. Verify expense was created for the connected user
    expenses_resp = await client.get("/api/v1/expenses", headers=headers)
    assert expenses_resp.status_code == 200
    items = expenses_resp.json()["items"]
    assert any(float(i["amount"]) == 300.0 and i["category"] == "Groceries" for i in items)


@pytest.mark.asyncio
async def test_channel_credential_encryption_and_masking(client: AsyncClient, test_user_token: str):
    """Verify credentials are encrypted at rest with Fernet and never exposed in responses."""
    from app.security.encryption import decrypt_credentials
    headers = {"Authorization": f"Bearer {test_user_token}"}

    secret_token = "ultra-secret-token-xyz-987"
    resp = await client.post(
        "/api/v1/channels/connect",
        json={
            "channel_type": "telegram",
            "external_identifier": "tg_secure_user",
            "credentials": {"bot_token": secret_token},
        },
        headers=headers
    )
    assert resp.status_code == 201
    body = resp.json()

    # 1. Credentials must NEVER appear in the connection response
    assert "credentials" not in body
    assert "credentials_encrypted" not in body
    assert secret_token not in str(body)

    # 2. Connections list must also mask/omit credentials
    list_resp = await client.get("/api/v1/channels/connections", headers=headers)
    assert list_resp.status_code == 200
    connections = list_resp.json()
    matched = [c for c in connections if c["external_identifier"] == "tg_secure_user"]
    assert len(matched) == 1
    assert "credentials" not in matched[0]
    assert secret_token not in str(list_resp.json())


@pytest.mark.asyncio
async def test_channel_verify_endpoint(client: AsyncClient, test_user_token: str):
    """Test channel credentials verification endpoint."""
    headers = {"Authorization": f"Bearer {test_user_token}"}

    # Testing verify with invalid/mock telegram token
    verify_resp = await client.post(
        "/api/v1/channels/verify",
        json={
            "channel_type": "telegram",
            "credentials": {"bot_token": "invalid-token"},
        },
        headers=headers
    )
    assert verify_resp.status_code == 200
    res = verify_resp.json()
    assert res["valid"] is False
    assert "failed" in res["message"].lower() or "rejected" in res["message"].lower()


@pytest.mark.asyncio
async def test_channel_update_endpoint(client: AsyncClient, test_user_token: str):
    """Verify PUT /api/v1/channels/connections/{id} updates identifier and credentials."""
    headers = {"Authorization": f"Bearer {test_user_token}"}

    # 1. Connect
    conn_resp = await client.post(
        "/api/v1/channels/connect",
        json={
            "channel_type": "telegram",
            "external_identifier": "tg_original_id",
            "credentials": {"bot_token": "original-bot-token"},
        },
        headers=headers
    )
    assert conn_resp.status_code == 201
    conn_id = conn_resp.json()["id"]

    # 2. Update external identifier
    update_resp = await client.put(
        f"/api/v1/channels/connections/{conn_id}",
        json={
            "external_identifier": "tg_updated_id",
        },
        headers=headers
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["external_identifier"] == "tg_updated_id"

    # 3. Update credentials as well
    update_resp2 = await client.put(
        f"/api/v1/channels/connections/{conn_id}",
        json={
            "credentials": {"bot_token": "new-secret-token-456"}
        },
        headers=headers
    )
    assert update_resp2.status_code == 200
    assert update_resp2.json()["external_identifier"] == "tg_updated_id"
    assert "credentials" not in update_resp2.json()
