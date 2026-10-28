"""Business-rule tests from section 3 of the brief.

Overdue = not Resolved AND created more than 24 hours ago.
Tickets are back-dated directly in the DB so no test waits 24 hours.
"""
from sqlalchemy import text

HOURS = 60  # minutes per hour


def _get(client, ticket_id):
    resp = client.get(f"/api/tickets/{ticket_id}")
    assert resp.status_code == 200, resp.text
    return resp.json()


def test_ticket_just_under_24h_is_not_overdue(client, make_ticket, backdate):
    ticket = make_ticket()
    backdate(ticket["id"], minutes=24 * HOURS - 1)  # 23h59m

    assert _get(client, ticket["id"])["is_overdue"] is False


def test_ticket_just_over_24h_is_overdue(client, make_ticket, backdate):
    ticket = make_ticket()
    backdate(ticket["id"], minutes=24 * HOURS + 1)  # 24h01m

    assert _get(client, ticket["id"])["is_overdue"] is True


def test_brand_new_ticket_is_not_overdue(client, make_ticket):
    ticket = make_ticket()
    assert _get(client, ticket["id"])["is_overdue"] is False


def test_resolved_ticket_is_never_overdue(client, make_ticket, set_status, backdate):
    ticket = make_ticket()
    backdate(ticket["id"], minutes=72 * HOURS)  # 3 days old
    set_status(ticket["id"], "resolved")

    assert _get(client, ticket["id"])["is_overdue"] is False


def test_resolving_an_overdue_ticket_clears_overdue(
    client, make_ticket, set_status, backdate
):
    ticket = make_ticket()
    backdate(ticket["id"], minutes=30 * HOURS)
    assert _get(client, ticket["id"])["is_overdue"] is True

    set_status(ticket["id"], "resolved")
    assert _get(client, ticket["id"])["is_overdue"] is False


def test_waiting_on_customer_still_counts_as_overdue(
    client, make_ticket, set_status, backdate
):
    # Assumption documented in README: only Resolved is excluded.
    ticket = make_ticket()
    set_status(ticket["id"], "waiting_on_customer")
    backdate(ticket["id"], minutes=30 * HOURS)

    assert _get(client, ticket["id"])["is_overdue"] is True


def test_reopened_old_ticket_is_overdue_again(
    client, make_ticket, set_status, backdate
):
    # Overdue is measured from created_at, so reopening does not reset it.
    ticket = make_ticket()
    backdate(ticket["id"], minutes=72 * HOURS)
    set_status(ticket["id"], "resolved")
    set_status(ticket["id"], "open")

    assert _get(client, ticket["id"])["is_overdue"] is True


def test_overdue_filter_returns_only_overdue_tickets(
    client, make_ticket, backdate
):
    fresh = make_ticket(subject="Fresh")
    old = make_ticket(subject="Old")
    backdate(old["id"], minutes=30 * HOURS)

    resp = client.get("/api/tickets", params={"overdue": "true"})
    ids = [t["id"] for t in resp.json()["items"]]

    assert ids == [old["id"]]
    assert fresh["id"] not in ids


def test_resolved_sets_resolved_at_and_reopen_clears_it(
    client, engine, make_ticket, set_status
):
    ticket = make_ticket()

    def resolved_at():
        with engine.connect() as conn:
            return conn.execute(
                text("SELECT resolved_at FROM tickets WHERE id = :id"),
                {"id": ticket["id"]},
            ).scalar_one()

    assert resolved_at() is None
    set_status(ticket["id"], "resolved")
    assert resolved_at() is not None
    set_status(ticket["id"], "open")
    assert resolved_at() is None


def test_status_change_to_resolved_is_recorded_in_history(
    client, make_ticket, set_status
):
    ticket = make_ticket()
    set_status(ticket["id"], "resolved")

    events = client.get(f"/api/tickets/{ticket['id']}/events").json()
    events = events["items"] if isinstance(events, dict) else events
    assert "status_changed" in [e["event_type"] for e in events]


def test_deleting_a_ticket_in_sql_leaves_no_orphans(
    client, engine, make_ticket, agents
):
    """Data-integrity rule: no orphaned messages/events if a ticket is deleted."""
    ticket = make_ticket()
    client.post(
        f"/api/tickets/{ticket['id']}/messages",
        json={"kind": "public_reply", "body": "hi", "author_id": agents[0]["id"]},
    )

    with engine.begin() as conn:
        conn.execute(text("DELETE FROM tickets WHERE id = :id"), {"id": ticket["id"]})
        orphan_messages = conn.execute(
            text("SELECT count(*) FROM ticket_messages WHERE ticket_id = :id"),
            {"id": ticket["id"]},
        ).scalar_one()
        orphan_events = conn.execute(
            text("SELECT count(*) FROM ticket_events WHERE ticket_id = :id"),
            {"id": ticket["id"]},
        ).scalar_one()

    assert orphan_messages == 0
    assert orphan_events == 0
