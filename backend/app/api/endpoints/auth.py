# ============================================================
# PetroVision — Auth Endpoints
# ============================================================

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    hash_password, verify_password, create_access_token, get_current_user,
    require_role,
)
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas import LoginRequest, Token, UserCreate, UserOut, UserUpdate

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user and return JWT token."""
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario desactivado",
        )

    # Update last login
    user.last_login = datetime.now(timezone.utc)
    db.commit()

    # Audit
    db.add(AuditLog(
        user_id=user.id,
        username=user.username,
        action="LOGIN",
        description=f"Inicio de sesión exitoso: {user.full_name} ({user.role})",
    ))
    db.commit()

    token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return Token(
        access_token=token,
        user=UserOut.model_validate(user),
    )


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role("admin")),
):
    """Register a new user (admin only)."""
    # Check duplicates
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username ya existe")
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email ya registrado")

    user = User(
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hash_password(user_data.password),
        role=user_data.role,
        area=user_data.area,
        shift=user_data.shift,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    db.add(AuditLog(
        user_id=_current_user.id,
        username=_current_user.username,
        action="CREATE",
        resource_type="user",
        resource_id=str(user.id),
        description=f"Usuario creado: {user.username} ({user.role})",
    ))
    db.commit()

    return UserOut.model_validate(user)


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user profile."""
    return UserOut.model_validate(current_user)


@router.get("/users", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role("admin", "supervisor")),
):
    """List all users (admin/supervisor only)."""
    return [UserOut.model_validate(u) for u in db.query(User).all()]


@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role("admin")),
):
    """Update user details (admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)
