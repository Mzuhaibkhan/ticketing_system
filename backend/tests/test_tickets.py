import pytest
from fastapi.testclient import TestClient
from app.models import Ticket, TicketEvent, EventType, TicketStatus, TicketPriority


def test_create_ticket_missing_fields(client: TestClient):
    """Asserts 422 with field-level details for subject, description, and customer."""
    # 1. Missing all fields
    res = client.post("/api/tickets", json={})
    assert res.status_code == 422
    data = res.json()
    assert "error" in data
    assert data["error"]["code"] == "validation_error"
    details = data["error"]["details"]
    fields = [d["field"] for d in details]
    assert "subject" in fields
    assert "description" in fields

    # 2. Blank whitespace-only fields
    res2 = client.post("/api/tickets", json={
        "subject": "   ",
        "description": "   ",
        "customer_name": "   ",
        "customer_email": ""
    })
    assert res2.status_code == 422
    data2 = res2.json()
    assert data2["error"]["code"] == "validation_error"

    # 3. Customer missing (neither name nor email)
    res3 = client.post("/api/tickets", json={
        "subject": "Valid Subject",
        "description": "Valid Description"
    })
    assert res3.status_code == 422
    data3 = res3.json()
    assert data3["error"]["code"] == "validation_error"
    assert any("customer" in d.get("message", "").lower() for d in data3["error"]["details"])


def test_create_ticket_success(client: TestClient, test_agents):
    """Asserts 201, defaults Open/Medium, one created event."""
    sarah = test_agents["sarah@example.com"]

    payload = {
        "subject": "Unable to export monthly billing statements",
        "customer_name": "Globex Corp",
        "customer_email": "finance@globex.com",
        "description": "The export button spins continuously without generating CSV.",
        "actor_id": sarah.id
    }

    res = client.post("/api/tickets", json=payload)
    assert res.status_code == 201

    ticket_data = res.json()
    ticket_id = ticket_data["id"]

    # Verify defaults & fields
    assert ticket_data["subject"] == payload["subject"]
    assert ticket_data["status"] == "open"
    assert ticket_data["priority"] == "medium"
    assert ticket_data["customer_name"] == "Globex Corp"
    assert ticket_data["customer_email"] == "finance@globex.com"
    assert ticket_data["is_overdue"] is False
    assert ticket_data["age_hours"] >= 0.0

    # Verify Location header
    assert res.headers["Location"] == f"/api/tickets/{ticket_id}"

    # Verify exactly one created audit event
    events_res = client.get(f"/api/tickets/{ticket_id}/events")
    assert events_res.status_code == 200
    events = events_res.json()
    assert len(events) == 1
    assert events[0]["event_type"] == "created"
    assert events[0]["actor_id"] == sarah.id
    assert events[0]["actor_name"] == sarah.name


def test_get_missing_ticket(client: TestClient):
    """Asserts 404 with ticket_not_found code."""
    res = client.get("/api/tickets/99999")
    assert res.status_code == 404
    data = res.json()
    assert "error" in data
    assert data["error"]["code"] == "ticket_not_found"
    assert "Ticket #99999 not found" in data["error"]["message"]


def test_combined_filters(client: TestClient, test_agents):
    """Asserts status + priority + assignee + q return only the exact intersection."""
    sarah = test_agents["sarah@example.com"]
    alex = test_agents["alex@example.com"]

    # Ticket A: Match on all 4 criteria
    # Status: Open, Priority: Urgent, Assignee: Sarah, Subject: Outage in EU region
    client.post("/api/tickets", json={
        "subject": "Major Database Outage in EU region",
        "customer_name": "Alpha Corp",
        "description": "DB connection pool exhausted.",
        "status": "open",
        "priority": "urgent",
        "assignee_id": sarah.id
    })

    # Ticket B: Matches q, status, priority, but WRONG assignee (Alex)
    client.post("/api/tickets", json={
        "subject": "EU Outage follow-up report",
        "customer_name": "Beta LLC",
        "description": "Requesting post-mortem details.",
        "status": "open",
        "priority": "urgent",
        "assignee_id": alex.id
    })

    # Ticket C: Matches q, priority, assignee, but WRONG status (In Progress)
    client.post("/api/tickets", json={
        "subject": "Outage mitigation for caching cluster",
        "customer_name": "Gamma Inc",
        "description": "Restarting worker nodes.",
        "status": "in_progress",
        "priority": "urgent",
        "assignee_id": sarah.id
    })

    # Ticket D: Matches q, status, assignee, but WRONG priority (Low)
    client.post("/api/tickets", json={
        "subject": "Outage documentation question",
        "customer_name": "Delta Co",
        "description": "Where is the SLA doc published?",
        "status": "open",
        "priority": "low",
        "assignee_id": sarah.id
    })

    # Ticket E: Matches status, priority, assignee, but WRONG search term q
    client.post("/api/tickets", json={
        "subject": "Billing issue on credit card payment",
        "customer_name": "Epsilon",
        "description": "Card charged twice.",
        "status": "open",
        "priority": "urgent",
        "assignee_id": sarah.id
    })

    # Query with all 4 filters combined:
    query_url = f"/api/tickets?status=open&priority=urgent&assignee_id={sarah.id}&q=Outage"
    res = client.get(query_url)
    assert res.status_code == 200
    data = res.json()

    # Must return ONLY Ticket A
    assert data["total"] == 1
    assert len(data["items"]) == 1
    assert data["items"][0]["subject"] == "Major Database Outage in EU region"
    assert data["items"][0]["customer_name"] == "Alpha Corp"


def test_assignee_not_found_returns_422(client: TestClient):
    """Assigning to non-existent agent returns 422 with field details."""
    res = client.post("/api/tickets", json={
        "subject": "Bad Assignee Test",
        "customer_name": "Test",
        "description": "Desc",
        "assignee_id": 99999
    })
    assert res.status_code == 422
    data = res.json()
    assert data["error"]["code"] == "validation_error"
    assert any(d["field"] == "assignee_id" for d in data["error"]["details"])

