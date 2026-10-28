from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.dashboard import DashboardStatsOut
from app.services import dashboard_service

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStatsOut)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Retrieve all ticket counts in a single aggregate query."""
    return dashboard_service.get_dashboard_stats(db)

