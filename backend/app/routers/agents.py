from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Agent
from app.schemas.agent import AgentOut

router = APIRouter(prefix="/api/agents", tags=["Agents"])


@router.get("", response_model=List[AgentOut])
def list_agents(db: Session = Depends(get_db)):
    """List all agents for assignee dropdowns and acting-as selector."""
    return db.query(Agent).order_by(Agent.name.asc()).all()

