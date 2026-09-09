"""
Seguridad: hash de contraseñas (bcrypt), tokens JWT y dependencia de auth.
"""
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import bcrypt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.core.config import settings

bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(sub: str, role: str = "client", expires_hours: int = 12) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=expires_hours)
    payload = {"sub": str(sub), "role": role, "exp": expire}
    return jwt.encode(payload, settings.API_SECRET_KEY, algorithm="HS256")


def decode_token(token: str) -> Dict[str, Any]:
    try:
        return jwt.decode(token, settings.API_SECRET_KEY, algorithms=["HS256"])
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Token inválido: {e}")


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Dict[str, Any]:
    """Dependencia de autenticación: exige Bearer token válido."""
    if credentials is None or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    return decode_token(credentials.credentials)


def require_development_only() -> None:
    """Barrera para endpoints simulados: solo disponibles fuera de producción."""
    if settings.ENVIRONMENT.lower() in ("production", "prod"):
        raise HTTPException(status_code=404, detail="Endpoint no disponible en producción")


def validate_password_strength(password: str):
    """Política profesional: 8+ caracteres, mayúscula, minúscula y dígito."""
    if len(password) < 8:
        return "La contraseña debe tener al menos 8 caracteres."
    if not any(c.isupper() for c in password):
        return "Debe incluir al menos una mayúscula."
    if not any(c.islower() for c in password):
        return "Debe incluir al menos una minúscula."
    if not any(c.isdigit() for c in password):
        return "Debe incluir al menos un número."
    return None


def generate_auth_token() -> str:
    import secrets
    return secrets.token_urlsafe(32)
