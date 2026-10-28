from pydantic import BaseModel


class DashboardStatsOut(BaseModel):
    total: int
    open: int
    in_progress: int
    waiting_on_customer: int
    resolved: int
    urgent: int
    overdue: int
    unresolved: int

