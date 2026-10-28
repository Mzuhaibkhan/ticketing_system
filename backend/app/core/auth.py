from datetime import datetime, timedelta, timezone
from typing import Optional
import bcrypt
import jwt
from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.models.agent import Agent
from app.models.enums import AgentRole
from app.core.errors import UnauthorizedError, ForbiddenError


def hash_password(password: str) -> str:
    """Generate bcrypt password hash."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: Optional[str]) -> bool:
    """Verify plaintext password against bcrypt hash."""
    if not hashed_password:
        return False
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Encode JWT access token with expiration."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.JWT_EXPIRY_MINUTES)
    to_encode.update({"exp": expire, "iat": now})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and validate JWT access token."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except Exception:
        return None


def get_current_agent(
    request: Request,
    db: Session = Depends(get_db)
) -> Agent:
    """FastAPI dependency to extract and authenticate current agent via Bearer token or httpOnly cookie."""
    token: Optional[str] = None

    # 1. Check Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()

    # 2. Check Cookie if no header token
    if not token:
        token = request.cookies.get("supportdesk_token")

    if not token:
        raise UnauthorizedError(
            code="unauthorized",
            message="Authentication required: please log in"
        )

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise UnauthorizedError(
            code="unauthorized",
            message="Invalid or expired authentication token"
        )

    try:
        agent_id = int(payload["sub"])
    except (ValueError, TypeError):
        raise UnauthorizedError(
            code="unauthorized",
            message="Invalid token payload"
        )

    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise UnauthorizedError(
            code="unauthorized",
            message="Authenticated agent not found"
        )

    return agent


def require_admin(
    agent: Agent = Depends(get_current_agent)
) -> Agent:
    """Dependency verifying the acting agent has ADMIN role."""
    if agent.role != AgentRole.ADMIN:
        raise ForbiddenError(
            code="forbidden",
            message="Admin role required for this action"
        )
    return agent

