import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models import Ticket, TicketStatus, TicketPriority


def test_dashboard_counts(client: TestClient, db_session: Session, test_agents):
    """Asserts dashboard counts match seeded fixture exactly across all metrics."""
    now = datetime.now(timezone.utc)
    sarah = test_agents["sarah@example.com"]
    alex = test_agents["alex@example.com"]

    # 1. Open, Urgent, Overdue (>30h old)
    t1 = Ticket(
        subject="Urgent Overdue Ticket",
        customer_name="Cust 1",
        description="Overdue outage",
        status=TicketStatus.OPEN,
        priority=TicketPriority.URGENT,
        assignee_id=sarah.id,
        created_at=now - timedelta(hours=30),
        updated_at=now - timedelta(hours=30),
    )

    # 2. In Progress, High, Recent (5h old, not overdue)
    t2 = Ticket(
        subject="High In Progress Ticket",
        customer_name="Cust 2",
        description="Work ongoing",
        status=TicketStatus.IN_PROGRESS,
        priority=TicketPriority.HIGH,
        assignee_id=alex.id,
        created_at=now - timedelta(hours=5),
        updated_at=now - timedelta(hours=5),
    )

    # 3. Waiting on Customer, Low, Recent (10h old, not overdue)
    t3 = Ticket(
        subject="Waiting Ticket",
        customer_name="Cust 3",
        description="Awaiting feedback",
        status=TicketStatus.WAITING_ON_CUSTOMER,
        priority=TicketPriority.LOW,
        assignee_id=None,
        created_at=now - timedelta(hours=10),
        updated_at=now - timedelta(hours=10),
    )

    # 4. Resolved, Medium (3 days old, resolved 1 day ago)
    t4 = Ticket(
        subject="Resolved Medium Ticket",
        customer_name="Cust 4",
        description="Completed task",
        status=TicketStatus.RESOLVED,
        priority=TicketPriority.MEDIUM,
        assignee_id=sarah.id,
        created_at=now - timedelta(days=3),
        updated_at=now - timedelta(days=1),
        resolved_at=now - timedelta(days=1),
    )

    # 5. Resolved, Urgent (2 days old, resolved 1 day ago)
    # Tests critical business rule: Resolved urgent tickets must NOT count towards unresolved urgent!
    t5 = Ticket(
        subject="Resolved Urgent Ticket",
        customer_name="Cust 5",
        description="Outage already fixed",
        status=TicketStatus.RESOLVED,
        priority=TicketPriority.URGENT,
        assignee_id=alex.id,
        created_at=now - timedelta(days=2),
        updated_at=now - timedelta(days=1),
        resolved_at=now - timedelta(days=1),
    )

    db_session.add_all([t1, t2, t3, t4, t5])
    db_session.commit()

    # Query GET /api/dashboard/stats
    res = client.get("/api/dashboard/stats")
    assert res.status_code == 200
    data = res.json()

    # Assert all 8 counters
    assert data["total"] == 5
    assert data["open"] == 1
    assert data["in_progress"] == 1
    assert data["waiting_on_customer"] == 1
    assert data["resolved"] == 2
    assert data["urgent"] == 1  # only unresolved urgent (Ticket 1)
    assert data["overdue"] == 1  # only Ticket 1 is >24h and unresolved
    assert data["unresolved"] == 3  # Tickets 1, 2, 3

