import asyncio
import logging
from typing import Dict, Any, Optional
import httpx
from sqlalchemy import select
from app.database.database import async_session_maker
from app.models.channel_connection import ChannelConnection
from app.security.encryption import decrypt_credentials
from app.services.channel_service import ChannelService
from app.services.conversation_service import ConversationService
from app.channels.channel_manager import ChannelManager

logger = logging.getLogger(__name__)

# Polling task handle
_telegram_poller_task: Optional[asyncio.Task] = None
_stop_polling = asyncio.Event()


async def process_telegram_update(update: Dict[str, Any]) -> None:
    """Process a single update received from Telegram getUpdates."""
    message = update.get("message")
    if not message:
        return

    chat = message.get("chat", {})
    from_user = message.get("from", {})
    sender_id = str(chat.get("id") or from_user.get("id") or "")
    text = str(message.get("text") or "").strip()

    if not sender_id or not text:
        return

    logger.info(f"Received Telegram message from {sender_id}: {text}")

    async with async_session_maker() as session:
        channel_svc = ChannelService(session)
        conv_svc = ConversationService(session)
        channel_mgr = ChannelManager(session)

        # 1. Resolve user by sender_id
        user_id = await channel_svc.resolve_identity("telegram", sender_id)
        if not user_id:
            # Check if any user registered this bot token with this chat id or external_id
            fallback_msg = (
                f"Hello! Your Telegram Chat ID ({sender_id}) is not linked to any Expense Tracker account.\n"
                f"Please open Settings in your Expense App dashboard, set Telegram Chat ID to `{sender_id}`, and click Connect & Encrypt."
            )
            await channel_mgr.send_message(
                user_id=None,
                channel_type="telegram",
                recipient_id=sender_id,
                message=fallback_msg
            )
            return

        # 2. Process turn with ExpenseAgent
        chat_resp = await conv_svc.handle_user_message(
            user_id=user_id,
            message_text=text,
            channel="telegram",
            external_id=sender_id
        )

        # 3. Send reply back to Telegram chat
        await channel_mgr.send_message(
            user_id=user_id,
            channel_type="telegram",
            recipient_id=sender_id,
            message=chat_resp.reply
        )
        await session.commit()


async def run_telegram_polling() -> None:
    """
    Background worker loop that fetches updates for connected Telegram bots.
    Enables instant two-way messaging on local machines without public ngrok URLs.
    """
    logger.info("Starting Telegram long-polling worker...")
    last_update_ids: Dict[str, int] = {}

    while not _stop_polling.is_set():
        try:
            # 1. Fetch active Telegram connections from DB
            tokens_to_poll = []
            async with async_session_maker() as session:
                res = await session.execute(
                    select(ChannelConnection).where(
                        ChannelConnection.channel_type == "telegram",
                        ChannelConnection.is_active == True
                    )
                )
                conns = res.scalars().all()
                for c in conns:
                    if c.credentials_encrypted:
                        try:
                            creds = decrypt_credentials(c.credentials_encrypted)
                            tok = creds.get("bot_token")
                            if tok and tok not in tokens_to_poll:
                                tokens_to_poll.append(tok)
                        except Exception:
                            pass

            if not tokens_to_poll:
                await asyncio.sleep(3)
                continue

            # 2. Poll each bot for new updates
            async with httpx.AsyncClient(timeout=15.0) as client:
                for token in tokens_to_poll:
                    offset = last_update_ids.get(token, 0)
                    url = f"https://api.telegram.org/bot{token}/getUpdates"
                    params = {"timeout": 3, "limit": 20}
                    if offset:
                        params["offset"] = offset

                    try:
                        resp = await client.get(url, params=params)
                        if resp.status_code == 200:
                            data = resp.json()
                            if data.get("ok"):
                                updates = data.get("result", [])
                                for upd in updates:
                                    upd_id = upd.get("update_id", 0)
                                    last_update_ids[token] = upd_id + 1
                                    await process_telegram_update(upd)
                    except Exception as err:
                        logger.debug(f"Error polling Telegram bot: {err}")

        except Exception as e:
            logger.error(f"Error in Telegram poller loop: {e}")

        await asyncio.sleep(1)


def start_telegram_poller() -> None:
    global _telegram_poller_task
    if _telegram_poller_task is None or _telegram_poller_task.done():
        _stop_polling.clear()
        _telegram_poller_task = asyncio.create_task(run_telegram_polling())


def stop_telegram_poller() -> None:
    global _telegram_poller_task
    if _telegram_poller_task:
        _stop_polling.set()
        _telegram_poller_task.cancel()
        _telegram_poller_task = None
