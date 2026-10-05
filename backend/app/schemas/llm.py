from typing import Optional, List
from pydantic import BaseModel, Field


class LLMConfigUpdate(BaseModel):
    provider: str = Field(..., description="Provider name: openai, anthropic, gemini, groq, ollama, or custom")
    model: str = Field(..., description="Model identifier, e.g. gpt-4o, claude-3-5-sonnet, gemini-1.5-flash, llama-3.3-70b-versatile")
    api_key: Optional[str] = Field(None, description="Raw API key from UI; will be encrypted at rest with AES-Fernet")
    base_url: Optional[str] = Field(None, description="Optional custom endpoint URL for local models or proxies")


class LLMConfigResponse(BaseModel):
    configured: bool
    provider: Optional[str] = None
    model: Optional[str] = None
    masked_api_key: Optional[str] = None
    base_url: Optional[str] = None


class LLMFetchModelsRequest(BaseModel):
    provider: str = Field(..., description="Provider name: openai, anthropic, gemini, groq, ollama, or custom")
    api_key: Optional[str] = Field(None, description="API Key to authenticate with provider endpoint")
    base_url: Optional[str] = Field(None, description="Optional custom endpoint URL")


class LLMFetchModelsResponse(BaseModel):
    success: bool
    models: List[str] = Field(default_factory=list)
    curl_command: str = Field(..., description="The curl command used/tested against the endpoint")
    message: Optional[str] = None
