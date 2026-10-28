"""Tests for optional stretch goals:
1. Pagination UI & tie-breakers
2. Configurable SLA first-response tracking
3. Optimistic concurrency control (409 conflict)
4. JWT Authentication, login, logout, and Admin/Agent role enforcement.
"""
from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from app.main import app
from app.core.auth import hash_password, get_current_agent
from tests.conftest import as_list

HOURS = 60


# ------------------------------------------------------------------ 1. Pagination
def test_pagination_large_set_deterministic(client, make_ticket):
    """Seed 45 tickets with page_size=20. Page 1=20, Page 2=20, Page 3=5; no duplicate IDs."""
    for i in range(45):
        make_ticket(subject=f"Bulk ticket #{i+1}")

    p1 = client.get("/api/tickets", params={"page": 1, "page_size": 20}).json()
    p2 = client.get("/api/tickets", params={"page": 2, "page_size": 20}).json()
    p3 = client.get("/api/tickets", params={"page": 3, "page_size": 20}).json()

    assert p1["total"] == 45
    assert len(p1["items"]) == 20
    assert len(p2["items"]) == 20
    assert len(p3["items"]) == 5

    all_ids = [t["id"] for t in p1["items"]] + [t["id"] for t in p2["items"]] + [t["id"] for t in p3["items"]]
    assert len(all_ids) == len(set(all_ids)) == 45


# ------------------------------------------------------------------ 2. Configurable SLA
def test_sla_breach_when_no_public_reply_past_target(client, make_ticket, backdate):
    """Urgent SLA is 4h. A 5h old open ticket with no reply is breached."""
    ticket = make_ticket(priority="urgent")
    backdate(ticket["id"], minutes=5 * HOURS)

    got = client.get(f"/api/tickets/{ticket['id']}").json()
    assert got["sla_target_hours"] == 4
    assert got["sla_breached"] is True


def test_sla_not_breached_when_under_target(client, make_ticket, backdate):
    """Urgent SLA is 4h. A 2h old ticket is not breached."""
    ticket = make_ticket(priority="urgent")
    backdate(ticket["id"], minutes=2 * HOURS)

    got = client.get(f"/api/tickets/{ticket['id']}").json()
    assert got["sla_target_hours"] == 4
    assert got["sla_breached"] is False


def test_public_reply_stops_sla_clock(client, make_ticket, backdate, agents):
    """Public reply sets first_responded_at within SLA; subsequent aging does not breach."""
    ticket = make_ticket(priority="urgent")
    # Ticket created 2h ago (urgent SLA is 4h, so due_at is now + 2h)
    backdate(ticket["id"], minutes=2 * HOURS)

    # Agent replies now (2h after creation, well within 4h SLA)
    client.post(
        f"/api/tickets/{ticket['id']}/messages",
        json={"kind": "public_reply", "body": "We got your ticket", "author_id": agents[0]["id"]},
    )

    got = client.get(f"/api/tickets/{ticket['id']}").json()
    assert got["first_responded_at"] is not None
    assert got["sla_breached"] is False


def test_internal_note_does_not_stop_sla_clock(client, make_ticket, backdate, agents):
    """Internal notes do NOT stop the SLA clock."""
    ticket = make_ticket(priority="urgent")
    # Internal note
    client.post(
        f"/api/tickets/{ticket['id']}/messages",
        json={"kind": "internal_note", "body": "Private note", "author_id": agents[0]["id"]},
    )
    # Fast forward 5 hours
    backdate(ticket["id"], minutes=5 * HOURS)

    got = client.get(f"/api/tickets/{ticket['id']}").json()
    assert got["first_responded_at"] is None
    assert got["sla_breached"] is True


def test_resolved_without_reply_is_not_actively_breached(client, make_ticket, set_status, backdate):
    """A resolved ticket with no public response is not flagged as actively breached."""
    ticket = make_ticket(priority="urgent")
    backdate(ticket["id"], minutes=5 * HOURS)
    set_status(ticket["id"], "resolved")

    got = client.get(f"/api/tickets/{ticket['id']}").json()
    assert got["sla_breached"] is False


# ------------------------------------------------------------------ 3. Optimistic Locking
def test_optimistic_locking_conflict_returns_409(client, make_ticket, agents):
    """Two concurrent PATCHes from the same starting version: first succeeds, second returns 409."""
    ticket = make_ticket()
    assert ticket["version"] == 1

    # First update sends expected_version=1 -> bumps to version 2
    r1 = client.patch(
        f"/api/tickets/{ticket['id']}",
        json={"status": "in_progress", "expected_version": 1, "actor_id": agents[0]["id"]},
    )
    assert r1.status_code == 200
    assert r1.json()["version"] == 2

    # Second stale update still sends expected_version=1 -> 409 Conflict
    r2 = client.patch(
        f"/api/tickets/{ticket['id']}",
        json={"status": "resolved", "expected_version": 1, "actor_id": agents[0]["id"]},
    )
    assert r2.status_code == 409
    body = r2.json()
    assert body["error"]["code"] == "conflict"

    # Verify status is still in_progress and no event was written by stale patch
    got = client.get(f"/api/tickets/{ticket['id']}").json()
    assert got["status"] == "in_progress"
    events = client.get(f"/api/tickets/{ticket['id']}/events").json()
    event_types = [e["event_type"] for e in as_list(events)]
    assert event_types.count("status_changed") == 1


def test_patch_without_expected_version_succeeds(client, make_ticket, agents):
    """PATCH without expected_version operates normally and increments version."""
    ticket = make_ticket()
    assert ticket["version"] == 1

    resp = client.patch(
        f"/api/tickets/{ticket['id']}",
        json={"priority": "high", "actor_id": agents[0]["id"]},
    )
    assert resp.status_code == 200
    assert resp.json()["version"] == 2


def test_adding_message_does_not_bump_version(client, make_ticket, agents):
    """Posting messages does NOT bump version, avoiding self-conflicts."""
    ticket = make_ticket()
    assert ticket["version"] == 1

    client.post(
        f"/api/tickets/{ticket['id']}/messages",
        json={"kind": "public_reply", "body": "Hello", "author_id": agents[0]["id"]},
    )
    got = client.get(f"/api/tickets/{ticket['id']}").json()
    assert got["version"] == 1


# ------------------------------------------------------------------ 4. Auth & Role Enforcement
def test_unauthenticated_request_returns_401(engine):
    """Without auth override or token, protected endpoints return 401."""
    # Temporarily remove override
    original = app.dependency_overrides.pop(get_current_agent, None)
    try:
        with TestClient(app) as raw_client:
            resp = raw_client.get("/api/tickets")
            assert resp.status_code == 401
            assert resp.json()["error"]["code"] == "unauthorized"
    finally:
        if original:
            app.dependency_overrides[get_current_agent] = original


def test_auth_login_success_and_logout(client, engine):
    """Login with valid password returns JWT token and cookie, /me returns user, logout clears it."""
    # Seed a known agent with password
    p_hash = hash_password("secret123")
    with engine.begin() as conn:
        conn.execute(
            text("INSERT INTO agents (name, email, password_hash, role) VALUES ('Demo Agent', 'demo@example.com', :p, 'agent') "
                 "ON CONFLICT (email) DO UPDATE SET password_hash = :p"),
            {"p": p_hash}
        )

    # Login
    resp = client.post(
        "/api/auth/login",
        json={"email": "demo@example.com", "password": "secret123"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data
    assert data["agent"]["email"] == "demo@example.com"

    # Test /me with Bearer token
    token = data["token"]
    # Temporarily remove dependency override to test real token auth
    original = app.dependency_overrides.pop(get_current_agent, None)
    try:
        with TestClient(app) as raw_client:
            me_resp = raw_client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
            assert me_resp.status_code == 200
            assert me_resp.json()["email"] == "demo@example.com"

            # Wrong password returns 401
            bad_login = raw_client.post("/api/auth/login", json={"email": "demo@example.com", "password": "wrong"})
            assert bad_login.status_code == 401

            # Login with .local domain (e.g. admin@demo.local) is accepted
            local_login = raw_client.post("/api/auth/login", json={"email": "admin@demo.local", "password": "password123"})
            assert local_login.status_code in (200, 401)  # If user exists in db 200, but NOT 422 validation error
            assert local_login.status_code != 422
    finally:
        if original:
            app.dependency_overrides[get_current_agent] = original


def test_agent_cannot_reassign_other_agent_ticket(client, make_ticket, agents):
    """An Agent cannot reassign a ticket already owned by another agent (403 forbidden)."""
    # Ticket assigned to Agent 2
    ticket = make_ticket(assignee_id=agents[1]["id"])

    # Agent 3 (role: agent) tries to reassign it to himself or unassigned
    resp = client.patch(
        f"/api/tickets/{ticket['id']}",
        json={"assignee_id": agents[2]["id"], "actor_id": agents[2]["id"]},
    )
    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "forbidden"


def test_admin_can_reassign_any_ticket(client, make_ticket, agents):
    """An Admin (agents[0] has role: admin) CAN reassign tickets owned by others."""
    ticket = make_ticket(assignee_id=agents[1]["id"])

    resp = client.patch(
        f"/api/tickets/{ticket['id']}",
        json={"assignee_id": agents[2]["id"], "actor_id": agents[0]["id"]},
    )
    assert resp.status_code == 200
    assert resp.json()["assignee"]["id"] == agents[2]["id"]


def test_agent_can_assign_unassigned_ticket(client, make_ticket, agents):
    """An Agent CAN claim / assign an unassigned ticket."""
    ticket = make_ticket()
    assert ticket.get("assignee") is None

    # Agent 2 claims it
    resp = client.patch(
        f"/api/tickets/{ticket['id']}",
        json={"assignee_id": agents[1]["id"], "actor_id": agents[1]["id"]},
    )
    assert resp.status_code == 200
    assert resp.json()["assignee"]["id"] == agents[1]["id"]
