from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import func, case
from sqlalchemy.orm import Session

from app.models import Ticket, TicketStatus, TicketPriority
from app.services.ticket_service import overdue_clause
from app.schemas.dashboard import DashboardStatsOut


def get_dashboard_stats(db: Session, now: Optional[datetime] = None) -> DashboardStatsOut:
    """Computes all 6 core dashboard counters + unresolved total in a single aggregate query.
    Reuses overdue_clause(now) and uses SQL case expressions compatible with both PostgreSQL and SQLite.
    """
    if now is None:
        now = datetime.now(timezone.utc)

    # Overdue condition from shared business rule
    is_overdue_cond = overdue_clause(now)

    query = db.query(
        func.count(Ticket.id).label("total"),
        func.coalesce(func.sum(case((Ticket.status == TicketStatus.OPEN, 1), else_=0)), 0).label("open"),
        func.coalesce(func.sum(case((Ticket.status == TicketStatus.IN_PROGRESS, 1), else_=0)), 0).label("in_progress"),
        func.coalesce(func.sum(case((Ticket.status == TicketStatus.WAITING_ON_CUSTOMER, 1), else_=0)), 0).label("waiting"),
        func.coalesce(func.sum(case((Ticket.status == TicketStatus.RESOLVED, 1), else_=0)), 0).label("resolved"),
        func.coalesce(func.sum(case((
            (Ticket.priority == TicketPriority.URGENT) & (Ticket.status != TicketStatus.RESOLVED),
            1
        ), else_=0)), 0).label("urgent"),
        func.coalesce(func.sum(case((is_overdue_cond, 1), else_=0)), 0).label("overdue"),
        func.coalesce(func.sum(case((Ticket.status != TicketStatus.RESOLVED, 1), else_=0)), 0).label("unresolved"),
    )

    row = query.one()

    return DashboardStatsOut(
        total=int(row.total or 0),
        open=int(row.open or 0),
        in_progress=int(row.in_progress or 0),
        waiting_on_customer=int(row.waiting or 0),
        resolved=int(row.resolved or 0),
        urgent=int(row.urgent or 0),
        overdue=int(row.overdue or 0),
        unresolved=int(row.unresolved or 0),
    )

