from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.agent import Agent
from app.schemas.agent import AgentOut
from app.core.auth import get_current_agent

router = APIRouter(prefix="/api/agents", tags=["Agents"])


@router.get("", response_model=List[AgentOut])
def list_agents(
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    """List all agents for assignee dropdowns and acting-as selector."""
    return db.query(Agent).order_by(Agent.name.asc()).all()
