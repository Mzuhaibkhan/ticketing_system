import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models import Ticket, TicketEvent, EventType, TicketStatus, TicketPriority


def test_overdue_boundary(client: TestClient, db_session: Session):
    """Asserts 23h59m old -> not overdue; 24h01m -> overdue.
    Boundary rule: strictly created_at < now - 24 hours.
    """
    now = datetime.now(timezone.utc)

    # Ticket 1: 23 hours 59 minutes old (not overdue)
    t_23h59 = Ticket(
        subject="Ticket under boundary",
        customer_name="Under Bound",
        description="Created 23h59m ago",
        status=TicketStatus.OPEN,
        priority=TicketPriority.MEDIUM,
        created_at=now - timedelta(hours=23, minutes=59),
        updated_at=now - timedelta(hours=23, minutes=59),
    )
    db_session.add(t_23h59)

    # Ticket 2: 24 hours 01 minutes old (overdue)
    t_24h01 = Ticket(
        subject="Ticket over boundary",
        customer_name="Over Bound",
        description="Created 24h01m ago",
        status=TicketStatus.OPEN,
        priority=TicketPriority.MEDIUM,
        created_at=now - timedelta(hours=24, minutes=1),
        updated_at=now - timedelta(hours=24, minutes=1),
    )
    db_session.add(t_24h01)
    db_session.commit()

    # 1. Detail endpoint check
    res_under = client.get(f"/api/tickets/{t_23h59.id}")
    assert res_under.status_code == 200
    assert res_under.json()["is_overdue"] is False
    assert res_under.json()["age_hours"] == 24.0 or res_under.json()["age_hours"] == 23.9 or res_under.json()["age_hours"] == 24.0

    res_over = client.get(f"/api/tickets/{t_24h01.id}")
    assert res_over.status_code == 200
    assert res_over.json()["is_overdue"] is True

    # 2. Overdue filter check (?overdue=true)
    res_filter = client.get("/api/tickets?overdue=true")
    assert res_filter.status_code == 200
    data_filter = res_filter.json()
    returned_ids = [item["id"] for item in data_filter["items"]]

    assert t_24h01.id in returned_ids
    assert t_23h59.id not in returned_ids


def test_resolved_not_overdue(client: TestClient, db_session: Session):
    """Asserts 3-day-old resolved ticket excluded from overdue and open counts."""
    now = datetime.now(timezone.utc)

    # 3-day-old ticket created and resolved 1 day ago
    t_resolved = Ticket(
        subject="Old resolved issue",
        customer_name="Old Customer",
        description="Old resolved ticket details",
        status=TicketStatus.RESOLVED,
        priority=TicketPriority.HIGH,
        created_at=now - timedelta(days=3),
        updated_at=now - timedelta(days=1),
        resolved_at=now - timedelta(days=1),
    )
    db_session.add(t_resolved)
    db_session.commit()

    # 1. Detail endpoint verification
    res = client.get(f"/api/tickets/{t_resolved.id}")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "resolved"
    assert data["is_overdue"] is False
    assert data["resolved_at"] is not None

    # 2. Excluded from overdue filter
    res_overdue = client.get("/api/tickets?overdue=true")
    assert res_overdue.status_code == 200
    assert t_resolved.id not in [item["id"] for item in res_overdue.json()["items"]]

    # 3. Excluded from open filter
    res_open = client.get("/api/tickets?status=open")
    assert res_open.status_code == 200
    assert t_resolved.id not in [item["id"] for item in res_open.json()["items"]]

    # 4. Excluded from dashboard overdue and open counts
    res_dash = client.get("/api/dashboard/stats")
    assert res_dash.status_code == 200
    dash_data = res_dash.json()
    assert dash_data["overdue"] == 0
    assert dash_data["open"] == 0
    assert dash_data["resolved"] == 1


def test_patch_writes_history(client: TestClient, test_agents):
    """Asserts status + priority + assignee change -> exactly 3 events with old/new values."""
    sarah = test_agents["sarah@example.com"]
    alex = test_agents["alex@example.com"]

    # Create initial ticket (Status: Open, Priority: Low, Assignee: Unassigned)
    create_res = client.post("/api/tickets", json={
        "subject": "Tracked field diff test",
        "customer_name": "Diff Corp",
        "description": "Testing that each tracked change logs an individual event",
        "status": "open",
        "priority": "low",
        "assignee_id": None,
        "actor_id": sarah.id
    })
    assert create_res.status_code == 201
    ticket_id = create_res.json()["id"]

    # PATCH status, priority, and assignee simultaneously
    patch_payload = {
        "status": "in_progress",
        "priority": "urgent",
        "assignee_id": alex.id,
        "actor_id": sarah.id
    }
    patch_res = client.patch(f"/api/tickets/{ticket_id}", json=patch_payload)
    assert patch_res.status_code == 200

    # Retrieve audit history
    events_res = client.get(f"/api/tickets/{ticket_id}/events")
    assert events_res.status_code == 200
    events = events_res.json()

    # Total 4 events: 1 'created' + exactly 3 new events
    assert len(events) == 4

    history_events = events[1:]
    event_types = {e["event_type"]: e for e in history_events}

    assert "status_changed" in event_types
    status_ev = event_types["status_changed"]
    assert status_ev["old_value"] == "open"
    assert status_ev["new_value"] == "in_progress"
    assert status_ev["actor_id"] == sarah.id
    assert status_ev["actor_name"] == sarah.name

    assert "priority_changed" in event_types
    priority_ev = event_types["priority_changed"]
    assert priority_ev["old_value"] == "low"
    assert priority_ev["new_value"] == "urgent"
    assert priority_ev["actor_id"] == sarah.id
    assert priority_ev["actor_name"] == sarah.name

    assert "assignee_changed" in event_types
    assignee_ev = event_types["assignee_changed"]
    assert assignee_ev["old_value"] == "Unassigned"
    assert assignee_ev["new_value"] == alex.name
    assert assignee_ev["actor_id"] == sarah.id
    assert assignee_ev["actor_name"] == sarah.name


def test_patch_noop_no_history(client: TestClient, db_session: Session):
    """Asserts same values sent -> 0 new events, updated_at unchanged."""
    # Create ticket
    create_res = client.post("/api/tickets", json={
        "subject": "No-op idempotency test",
        "customer_name": "Static Corp",
        "description": "Sending identical values should write nothing",
        "status": "open",
        "priority": "medium"
    })
    assert create_res.status_code == 201
    ticket = create_res.json()
    ticket_id = ticket["id"]
    original_updated_at = ticket["updated_at"]

    # Count initial events (exactly 1 created)
    events_initial = client.get(f"/api/tickets/{ticket_id}/events").json()
    assert len(events_initial) == 1

    # PATCH with same status and priority
    patch_res = client.patch(f"/api/tickets/{ticket_id}", json={
        "status": "open",
        "priority": "medium"
    })
    assert patch_res.status_code == 200
    patched_ticket = patch_res.json()

    # Events count is still exactly 1 (0 new events)
    events_after = client.get(f"/api/tickets/{ticket_id}/events").json()
    assert len(events_after) == 1

    # updated_at is unchanged
    assert patched_ticket["updated_at"] == original_updated_at


def test_message_bumps_updated_at(client: TestClient, db_session: Session, test_agents):
    """Asserts adding a note creates note_added event and newer updated_at."""
    sarah = test_agents["sarah@example.com"]
    now = datetime.now(timezone.utc)

    # Create ticket with older updated_at
    past_time = now - timedelta(hours=2)
    ticket = Ticket(
        subject="Message activity test",
        customer_name="Active User",
        description="Testing that messages bump ticket updated_at",
        status=TicketStatus.OPEN,
        priority=TicketPriority.MEDIUM,
        created_at=past_time,
        updated_at=past_time,
    )
    db_session.add(ticket)
    db_session.commit()
    db_session.refresh(ticket)

    # Post an internal note
    note_payload = {
        "kind": "internal_note",
        "body": "Customer confirmed they will verify network firewall tomorrow morning.",
        "author_id": sarah.id
    }
    msg_res = client.post(f"/api/tickets/{ticket.id}/messages", json=note_payload)
    assert msg_res.status_code == 201

    # Fetch updated ticket
    ticket_res = client.get(f"/api/tickets/{ticket.id}")
    assert ticket_res.status_code == 200
    refreshed = ticket_res.json()

    # updated_at must be strictly newer than past_time
    assert refreshed["updated_at"] > past_time.isoformat()

    # Verify event was recorded
    events = client.get(f"/api/tickets/{ticket.id}/events").json()
    note_events = [e for e in events if e["event_type"] == "note_added"]
    assert len(note_events) == 1
    assert note_events[0]["actor_id"] == sarah.id
    assert note_events[0]["actor_name"] == sarah.name

