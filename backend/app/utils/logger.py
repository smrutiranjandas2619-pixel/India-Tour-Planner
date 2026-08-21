import re
import traceback

def sanitize_text(text: str) -> str:
    # Redact Firebase API Keys
    text = re.sub(r'AIzaSy[A-Za-z0-9_\\-]{35}', '[REDACTED_FIREBASE_API_KEY]', text)
    # Redact Groq API Keys
    text = re.sub(r'gsk_[A-Za-z0-9_\\-]{40,}', '[REDACTED_GROQ_API_KEY]', text)
    # Redact JWT tokens
    text = re.sub(r'ey[A-Za-z0-9_\\-]{15,}\\.ey[A-Za-z0-9_\\-]{15,}\\.[A-Za-z0-9_\\-]{20,}', '[REDACTED_JWT_TOKEN]', text)
    # Redact password/token params in query strings, json keys, urls, or traceback strings
    text = re.sub(r"(?i)(key|pass|password|token|secret|auth_token|api_key)=[^&\s'\"\\\\]+", r"\1=[REDACTED]", text)
    return text

def write_safe_error_log(log_path: str):
    tb_str = traceback.format_exc()
    sanitized_tb = sanitize_text(tb_str)
    with open(log_path, "w", encoding="utf-8") as f:
        f.write(sanitized_tb)
