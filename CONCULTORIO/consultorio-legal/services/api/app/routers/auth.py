"""Router de autenticación — registro, login, perfil."""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import Usuario
from app.schemas import UsuarioCreate, UsuarioResponse, Token
from app.services.auth_service import (
    get_password_hash, verify_password,
    create_access_token, get_current_user,
)

router = APIRouter()


@router.post("/registro", response_model=Token, status_code=status.HTTP_201_CREATED)
async def registro(data: UsuarioCreate, db: AsyncSession = Depends(get_db)):
    """Registra un nuevo usuario en la plataforma."""
    # Verificar email único
    result = await db.execute(select(Usuario).where(Usuario.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    user = Usuario(
        nombre=data.nombre,
        email=data.email,
        hashed_password=get_password_hash(data.password),
        telefono=data.telefono,
        cedula=data.cedula,
        tipo_usuario=data.tipo_usuario,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": str(user.id), "email": user.email})
    return Token(access_token=token, user=UsuarioResponse.model_validate(user))


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """Inicia sesión con email y contraseña."""
    result = await db.execute(select(Usuario).where(Usuario.email == form_data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
        )
    if not user.activo:
        raise HTTPException(status_code=403, detail="Cuenta desactivada")

    token = create_access_token({"sub": str(user.id), "email": user.email})
    return Token(access_token=token, user=UsuarioResponse.model_validate(user))


@router.get("/me", response_model=UsuarioResponse)
async def me(current_user: Usuario = Depends(get_current_user)):
    """Retorna el perfil del usuario autenticado."""
    return UsuarioResponse.model_validate(current_user)
