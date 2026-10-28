from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.agent import Agent
from app.schemas.dashboard import DashboardStatsOut
from app.services import dashboard_service
from app.core.auth import get_current_agent

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStatsOut)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    """Retrieve all ticket counts in a single aggregate query."""
    return dashboard_service.get_dashboard_stats(db)
