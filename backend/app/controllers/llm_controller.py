from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.models.user import User
from app.schemas.llm import (
    LLMConfigUpdate,
    LLMConfigResponse,
    LLMFetchModelsRequest,
    LLMFetchModelsResponse
)
from app.security.auth import get_current_user
from app.security.encryption import encrypt_credentials, decrypt_credentials
from app.services.llm_fetcher import execute_curl_fetch_models, mask_key

router = APIRouter(prefix="/llm", tags=["LLM Configuration"])


@router.get("/config", response_model=LLMConfigResponse)
async def get_llm_config(
    current_user: User = Depends(get_current_user)
) -> LLMConfigResponse:
    """
    Get user-configured LLM provider and model.
    The personal API key is always masked (e.g. sk-••••1234) and never returned in cleartext.
    """
    if not current_user.llm_provider:
        return LLMConfigResponse(configured=False)

    masked = None
    if current_user.llm_api_key_encrypted:
        try:
            raw_key_dict = decrypt_credentials(current_user.llm_api_key_encrypted)
            raw_key = raw_key_dict.get("api_key") or raw_key_dict.get("value", "")
            masked = mask_key(raw_key)
        except Exception:
            masked = "••••••••"

    return LLMConfigResponse(
        configured=True,
        provider=current_user.llm_provider,
        model=current_user.llm_model,
        masked_api_key=masked,
        base_url=current_user.llm_base_url,
    )


@router.put("/config", response_model=LLMConfigResponse)
async def update_llm_config(
    data: LLMConfigUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> LLMConfigResponse:
    """
    Save or update user's LLM provider, model, and API key.
    API keys are encrypted at rest with AES-Fernet cryptography.
    """
    current_user.llm_provider = data.provider.lower().strip()
    current_user.llm_model = data.model.strip()
    current_user.llm_base_url = data.base_url.strip() if data.base_url else None

    # Only update API key if a new one is provided
    if data.api_key and data.api_key.strip():
        # Store encrypted dict
        current_user.llm_api_key_encrypted = encrypt_credentials({"api_key": data.api_key.strip()})

    await db.flush()
    await db.refresh(current_user)

    masked = None
    if current_user.llm_api_key_encrypted:
        try:
            raw_dict = decrypt_credentials(current_user.llm_api_key_encrypted)
            raw_key = raw_dict.get("api_key") or raw_dict.get("value", "")
            masked = mask_key(raw_key)
        except Exception:
            masked = "••••••••"

    return LLMConfigResponse(
        configured=True,
        provider=current_user.llm_provider,
        model=current_user.llm_model,
        masked_api_key=masked,
        base_url=current_user.llm_base_url,
    )


@router.delete("/config", status_code=status.HTTP_204_NO_CONTENT)
async def delete_llm_config(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> None:
    """
    Remove user's custom LLM configuration and purge encrypted key.
    Platform will return to default / offline fallback mode.
    """
    current_user.llm_provider = None
    current_user.llm_model = None
    current_user.llm_api_key_encrypted = None
    current_user.llm_base_url = None
    await db.flush()


@router.post("/fetch-models", response_model=LLMFetchModelsResponse)
async def fetch_available_models(
    data: LLMFetchModelsRequest,
    current_user: User = Depends(get_current_user)
) -> LLMFetchModelsResponse:
    """
    Runs the curl command against the provider endpoint using the API key to fetch available models.
    Supports OpenAI, Anthropic, Gemini, Groq, Ollama, and Custom endpoints.
    """
    api_key_to_use = data.api_key
    # If no key provided in payload, check if user already has an encrypted key stored
    if not api_key_to_use and current_user.llm_api_key_encrypted:
        try:
            decrypted = decrypt_credentials(current_user.llm_api_key_encrypted)
            api_key_to_use = decrypted.get("api_key") or decrypted.get("value", "")
        except Exception:
            pass

    success, models, curl_cmd, msg = await execute_curl_fetch_models(
        provider=data.provider,
        api_key=api_key_to_use,
        base_url=data.base_url or current_user.llm_base_url
    )

    return LLMFetchModelsResponse(
        success=success,
        models=models,
        curl_command=curl_cmd,
        message=msg
    )
