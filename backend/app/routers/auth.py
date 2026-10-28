from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.agent import Agent
from app.schemas.agent import AgentOut, LoginRequest, LoginResponse
from app.core.auth import (
    create_access_token,
    get_current_agent,
    verify_password,
)
from app.core.errors import UnauthorizedError

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/login", response_model=LoginResponse)
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    """Authenticate an agent via email and password, returning a JWT token and setting an httpOnly cookie."""
    agent = db.query(Agent).filter(Agent.email == payload.email.lower().strip()).first()
    if not agent or not verify_password(payload.password, agent.password_hash):
        raise UnauthorizedError(
            code="invalid_credentials",
            message="Invalid email or password"
        )

    token = create_access_token(data={"sub": str(agent.id), "email": agent.email, "role": agent.role.value})

    # Set httpOnly cookie with SameSite=Lax for secure browser session handling
    response.set_cookie(
        key="supportdesk_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,  # Set to True in HTTPS production if needed
        max_age=60 * 60 * 24,  # 24 hours
        path="/"
    )

    return LoginResponse(
        token=token,
        agent=AgentOut.model_validate(agent)
    )


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(response: Response):
    """Clear session authentication cookie."""
    response.delete_cookie(key="supportdesk_token", path="/")
    return {"status": "ok", "message": "Successfully logged out"}


@router.get("/me", response_model=AgentOut)
def get_me(agent: Agent = Depends(get_current_agent)):
    """Retrieve profile and role information for currently authenticated agent."""
    return AgentOut.model_validate(agent)

