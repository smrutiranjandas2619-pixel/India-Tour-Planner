import hashlib

def hash_password(password: str) -> str:
    """Hashes passwords using standard SHA-256 for secure verification and persistence."""
    return hashlib.sha256(password.encode()).hexdigest()
