import asyncio
import json
import re
from typing import List, Tuple, Optional


def mask_key(key: Optional[str]) -> Optional[str]:
    """Mask sensitive API key, showing only start and end characters."""
    if not key:
        return None
    key = key.strip()
    if len(key) <= 8:
        return "••••••••"
    return f"{key[:4]}••••{key[-4:]}"


def build_curl_command(provider: str, api_key: Optional[str], base_url: Optional[str], mask_in_output: bool = False) -> Tuple[List[str], str, str]:
    """
    Constructs the curl command argument list and display string for fetching models.
    Returns: (cmd_args_list, display_curl_command, url)
    """
    prov = (provider or "").lower().strip()
    key_val = (api_key or "").strip()
    display_key = mask_key(key_val) if (mask_in_output and key_val) else key_val

    if prov == "openai":
        url = (base_url or "https://api.openai.com/v1").rstrip("/") + "/models"
        args = ["curl", "-s", "-X", "GET", url, "-H", f"Authorization: Bearer {key_val}"]
        disp = f'curl -s -X GET "{url}" -H "Authorization: Bearer {display_key}"'

    elif prov == "groq":
        url = (base_url or "https://api.groq.com/openai/v1").rstrip("/") + "/models"
        args = ["curl", "-s", "-X", "GET", url, "-H", f"Authorization: Bearer {key_val}"]
        disp = f'curl -s -X GET "{url}" -H "Authorization: Bearer {display_key}"'

    elif prov in ("gemini", "google"):
        # Google Generative Language API
        url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key_val}"
        disp_url = f"https://generativelanguage.googleapis.com/v1beta/models?key={display_key}"
        args = ["curl", "-s", "-X", "GET", url]
        disp = f'curl -s -X GET "{disp_url}"'

    elif prov == "anthropic":
        url = (base_url or "https://api.anthropic.com/v1").rstrip("/") + "/models"
        args = [
            "curl", "-s", "-X", "GET", url,
            "-H", f"x-api-key: {key_val}",
            "-H", "anthropic-version: 2023-06-01"
        ]
        disp = f'curl -s -X GET "{url}" -H "x-api-key: {display_key}" -H "anthropic-version: 2023-06-01"'

    elif prov == "ollama":
        url = (base_url or "http://localhost:11434").rstrip("/") + "/api/tags"
        args = ["curl", "-s", "-X", "GET", url]
        disp = f'curl -s -X GET "{url}"'

    else:
        # Custom / OpenAI-compatible endpoint
        endpoint = (base_url or "http://localhost:8000/v1").rstrip("/")
        if not endpoint.endswith("/models"):
            endpoint += "/models"
        url = endpoint
        if key_val:
            args = ["curl", "-s", "-X", "GET", url, "-H", f"Authorization: Bearer {key_val}"]
            disp = f'curl -s -X GET "{url}" -H "Authorization: Bearer {display_key}"'
        else:
            args = ["curl", "-s", "-X", "GET", url]
            disp = f'curl -s -X GET "{url}"'

    return args, disp, url


async def execute_curl_fetch_models(provider: str, api_key: Optional[str], base_url: Optional[str]) -> Tuple[bool, List[str], str, str]:
    """
    Executes the curl command via async subprocess to check available models for the given provider and endpoint.
    Returns: (success, models_list, display_curl_cmd, message)
    """
    args, disp_cmd, target_url = build_curl_command(provider, api_key, base_url, mask_in_output=True)

    try:
        proc = await asyncio.create_subprocess_exec(
            *args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=12.0)
        output_str = stdout.decode("utf-8", errors="replace").strip()
        error_str = stderr.decode("utf-8", errors="replace").strip()

        if proc.returncode != 0:
            return False, [], disp_cmd, f"curl exited with code {proc.returncode}: {error_str or 'Connection failed'}"

        if not output_str:
            return False, [], disp_cmd, "Empty response received from endpoint."

        try:
            parsed = json.loads(output_str)
        except json.JSONDecodeError:
            return False, [], disp_cmd, f"Invalid JSON returned: {output_str[:200]}"

        # Check for provider error bodies
        if isinstance(parsed, dict) and "error" in parsed:
            err = parsed["error"]
            err_msg = err.get("message", str(err)) if isinstance(err, dict) else str(err)
            return False, [], disp_cmd, f"Provider error: {err_msg}"

        prov = (provider or "").lower().strip()
        models: List[str] = []

        if prov in ("openai", "groq") or (prov == "custom" and "data" in parsed):
            if "data" in parsed and isinstance(parsed["data"], list):
                models = [m["id"] for m in parsed["data"] if isinstance(m, dict) and "id" in m]

        elif prov in ("gemini", "google"):
            if "models" in parsed and isinstance(parsed["models"], list):
                for m in parsed["models"]:
                    name = m.get("name", "")
                    if name.startswith("models/"):
                        name = name[len("models/"):]
                    if name:
                        models.append(name)

        elif prov == "anthropic":
            if "data" in parsed and isinstance(parsed["data"], list):
                models = [m["id"] for m in parsed["data"] if isinstance(m, dict) and "id" in m]

        elif prov == "ollama":
            if "models" in parsed and isinstance(parsed["models"], list):
                models = [m.get("name", "") for m in parsed["models"] if isinstance(m, dict) and m.get("name")]

        else:
            # Generic fallback: check 'data' or 'models'
            if "data" in parsed and isinstance(parsed["data"], list):
                models = [m.get("id", str(m)) for m in parsed["data"]]
            elif "models" in parsed and isinstance(parsed["models"], list):
                models = [m.get("name", m.get("id", str(m))) for m in parsed["models"]]

        # Filter and sort
        cleaned_models = sorted(list(set([m for m in models if m])))
        if cleaned_models:
            return True, cleaned_models, disp_cmd, f"Found {len(cleaned_models)} available models."
        else:
            return True, [], disp_cmd, "Connected successfully, but no models found in response."

    except asyncio.TimeoutError:
        return False, [], disp_cmd, f"Timeout connecting to {target_url} after 12s."
    except Exception as ex:
        return False, [], disp_cmd, f"Failed to execute curl: {str(ex)}"
