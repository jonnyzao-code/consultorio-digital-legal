"""
Autenticación profesional: registro con confirmación de correo, reenvío,
login gated por verificación, restablecimiento de contraseña por token y perfil.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.mailer import send_mail
from app.core.security import (
    create_access_token,
    generate_auth_token,
    get_current_user,
    hash_password,
    validate_password_strength,
    verify_password,
)
from app.models.entities import User, UserRole

router = APIRouter()


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=2)
    document_number: Optional[str] = None
    phone: Optional[str] = None


class ConfirmEmailRequest(BaseModel):
    token: str


class ResendConfirmationRequest(BaseModel):
    email: EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int


class MeResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    document_number: Optional[str]
    phone: Optional[str]
    email_verified: bool
    created_at: datetime


def _base_url() -> str:
    return "http://localhost:9504" if settings.ENVIRONMENT.lower() != "production" else "https://consultoriodigitallegal.co"


@router.post("/register", summary="Registrar (envía confirmación al correo)")
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no configurada")
    strong = validate_password_strength(req.password)
    if strong:
        raise HTTPException(status_code=422, detail=strong)
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="El correo ya está registrado")
    token = generate_auth_token()
    user = User(
        email=req.email,
        hashed_password=hash_password(req.password),
        full_name=req.full_name,
        document_number=req.document_number or None,
        phone=req.phone or None,
        role=UserRole.CLIENT,
        email_verified=False,
        confirmation_token=token,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    link = f"{_base_url()}/#confirmar?token={token}"
    mail = send_mail(
        req.email,
        "Confirma tu cuenta - Consultorio Digital Legal",
        f"<p>Hola {req.full_name},</p><p>Confirma tu cuenta abriendo:</p>"
        f'<p><a href="{link}">Confirmar mi cuenta</a></p>'
        f"<p>Si no solicitaste este registro, ignora este correo.</p>",
    )
    return {
        "ok": True,
        "message": "Cuenta creada. Revisa tu correo y confirma para ingresar.",
        "dev_link": mail.get("dev_link") if not mail.get("sent") else None,
    }


@router.post("/confirm-email", summary="Confirmar correo con el token recibido")
async def confirm_email(req: ConfirmEmailRequest, db: AsyncSession = Depends(get_db)):
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no configurada")
    result = await db.execute(select(User).where(User.confirmation_token == req.token))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="Token de confirmación inválido o expirado")
    user.email_verified = True
    user.confirmation_token = None
    await db.flush()
    return {"ok": True, "message": "Correo confirmado. Ya puedes ingresar."}


@router.post("/resend-confirmation", summary="Reenviar correo de confirmación")
async def resend_confirmation(req: ResendConfirmationRequest, db: AsyncSession = Depends(get_db)):
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no configurada")
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if user and not user.email_verified:
        user.confirmation_token = generate_auth_token()
        await db.flush()
        link = f"{_base_url()}/#confirmar?token={user.confirmation_token}"
        mail = send_mail(user.email, "Confirma tu cuenta - Consultorio Digital Legal",
                         f'<p>Reenvío de confirmación: <a href="{link}">Confirmar mi cuenta</a></p>')
        if mail.get("dev_link"):
            return {"ok": True, "dev_link": mail["dev_link"]}
    return {"ok": True}


@router.post("/login", response_model=TokenResponse, summary="Iniciar sesión")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no configurada")
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if not user or not user.hashed_password or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    if not user.email_verified:
        raise HTTPException(status_code=403, detail="Correo no confirmado. Revisa tu bandeja o reenvía la confirmación.")
    token = create_access_token(sub=user.id, role=user.role.value)
    return TokenResponse(access_token=token, role=user.role.value, user_id=user.id)


@router.post("/forgot-password", summary="Solicitar restablecimiento de contraseña")
async def forgot_password(req: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no configurada")
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if user and user.is_active:
        user.reset_token = generate_auth_token()
        user.reset_token_expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        await db.flush()
        link = f"{_base_url()}/#recuperar?token={user.reset_token}"
        mail = send_mail(user.email, "Restablece tu contraseña - Consultorio Digital Legal",
                         f'<p>Para restablecer tu contraseña abre: <a href="{link}">Restablecer contraseña</a>.</p>'
                         f"<p>El enlace vence en 1 hora. Si no lo solicitaste, ignora este correo.</p>")
        if mail.get("dev_link"):
            return {"ok": True, "dev_link": mail["dev_link"]}
    return {"ok": True}


@router.post("/reset-password", summary="Restablecer contraseña con el token")
async def reset_password(req: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no configurada")
    strong = validate_password_strength(req.new_password)
    if strong:
        raise HTTPException(status_code=422, detail=strong)
    result = await db.execute(select(User).where(User.reset_token == req.token))
    user = result.scalar_one_or_none()
    now = datetime.now(timezone.utc)
    if not user or not user.reset_token_expires_at:
        raise HTTPException(status_code=400, detail="Token de restablecimiento inválido")
    exp = user.reset_token_expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < now:
        raise HTTPException(status_code=400, detail="El token de restablecimiento expiró. Solicita uno nuevo.")
    user.hashed_password = hash_password(req.new_password)
    user.reset_token = None
    user.reset_token_expires_at = None
    await db.flush()
    return {"ok": True, "message": "Contraseña actualizada. Ya puedes ingresar con la nueva."}


@router.get("/me", response_model=MeResponse, summary="Perfil del usuario autenticado")
async def me(claims: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no configurada")
    user_id = int(claims.get("sub", 0))
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return MeResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
        document_number=user.document_number,
        phone=user.phone,
        email_verified=user.email_verified,
        created_at=user.created_at,
    )
