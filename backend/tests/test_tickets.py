"""API tests: ticket creation, validation, updates + history, replies/notes,
search / filters / sorting / pagination."""
import json
from datetime import datetime

from tests.conftest import as_list, error_fields


def _events(client, ticket_id):
    resp = client.get(f"/api/tickets/{ticket_id}/events")
    assert resp.status_code == 200, resp.text
    return as_list(resp.json())


def _messages(client, ticket_id):
    resp = client.get(f"/api/tickets/{ticket_id}/messages")
    assert resp.status_code == 200, resp.text
    return as_list(resp.json())


def _ts(value):
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


# ------------------------------------------------------------------ create

def test_create_ticket_success_defaults_and_created_event(client, make_ticket):
    ticket = make_ticket()

    assert ticket["status"] == "open"
    assert ticket["priority"] == "medium"
    assert ticket["id"] > 0

    events = _events(client, ticket["id"])
    assert [e["event_type"] for e in events] == ["created"]


def test_create_ticket_missing_required_fields_returns_field_errors(client, agents):
    resp = client.post("/api/tickets", json={"actor_id": agents[0]["id"]})

    assert resp.status_code == 422
    body = resp.json()
    assert body["error"]["code"] == "validation_error"
    fields = error_fields(resp)
    assert "subject" in fields
    assert "description" in fields


def test_create_ticket_requires_customer_name_or_email(client, agents):
    resp = client.post(
        "/api/tickets",
        json={
            "subject": "No customer",
            "description": "Missing both customer fields",
            "actor_id": agents[0]["id"],
        },
    )
    assert resp.status_code == 422


def test_create_ticket_customer_name_alone_is_enough(client, agents):
    resp = client.post(
        "/api/tickets",
        json={
            "subject": "Name only",
            "customer_name": "Jane Doe",
            "description": "Customer gave only a name",
            "actor_id": agents[0]["id"],
        },
    )
    assert resp.status_code == 201, resp.text


def test_create_ticket_whitespace_only_values_rejected(client, agents):
    resp = client.post(
        "/api/tickets",
        json={
            "subject": "   ",
            "customer_email": "jane@example.com",
            "description": "   ",
            "actor_id": agents[0]["id"],
        },
    )
    assert resp.status_code == 422
    fields = error_fields(resp)
    assert {"subject", "description"} <= fields


def test_create_ticket_invalid_email_rejected(client, agents):
    resp = client.post(
        "/api/tickets",
        json={
            "subject": "Bad email",
            "customer_email": "not-an-email",
            "description": "x",
            "actor_id": agents[0]["id"],
        },
    )
    assert resp.status_code == 422
    assert "customer_email" in error_fields(resp)


def test_create_ticket_invalid_enum_rejected(client, agents):
    resp = client.post(
        "/api/tickets",
        json={
            "subject": "Bad priority",
            "customer_email": "jane@example.com",
            "description": "x",
            "priority": "super-duper",
            "actor_id": agents[0]["id"],
        },
    )
    assert resp.status_code == 422


def test_create_ticket_unknown_assignee_rejected(client, agents):
    resp = client.post(
        "/api/tickets",
        json={
            "subject": "Bad assignee",
            "customer_email": "jane@example.com",
            "description": "x",
            "assignee_id": 999999,
            "actor_id": agents[0]["id"],
        },
    )
    assert resp.status_code == 422


# --------------------------------------------------------------------- get

def test_get_missing_ticket_returns_404_with_code(client):
    resp = client.get("/api/tickets/99999")

    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "ticket_not_found"


def test_get_ticket_with_non_numeric_id_is_client_error(client):
    resp = client.get("/api/tickets/abc")
    assert resp.status_code in (400, 422)


def test_get_ticket_returns_created_ticket(client, make_ticket):
    ticket = make_ticket(subject="Findable ticket")
    resp = client.get(f"/api/tickets/{ticket['id']}")

    assert resp.status_code == 200
    assert resp.json()["subject"] == "Findable ticket"


# ------------------------------------------------------------------- patch

def test_patch_status_priority_assignee_writes_three_events(
    client, make_ticket, agents
):
    ticket = make_ticket()
    resp = client.patch(
        f"/api/tickets/{ticket['id']}",
        json={
            "status": "in_progress",
            "priority": "urgent",
            "assignee_id": agents[1]["id"],
            "actor_id": agents[0]["id"],
        },
    )
    assert resp.status_code == 200, resp.text

    events = _events(client, ticket["id"])
    types = sorted(e["event_type"] for e in events)
    assert types == sorted(
        ["created", "status_changed", "priority_changed", "assignee_changed"]
    )

    # New value is recorded on the status event (works for text or JSON storage).
    status_event = next(e for e in events if e["event_type"] == "status_changed")
    assert "in_progress" in json.dumps(status_event)


def test_patch_with_same_values_is_noop_no_events_no_updated_at_bump(
    client, make_ticket, agents
):
    ticket = make_ticket(priority="high")
    before = client.get(f"/api/tickets/{ticket['id']}").json()

    resp = client.patch(
        f"/api/tickets/{ticket['id']}",
        json={
            "status": "open",
            "priority": "high",
            "actor_id": agents[0]["id"],
        },
    )
    assert resp.status_code == 200

    after = client.get(f"/api/tickets/{ticket['id']}").json()
    assert after["updated_at"] == before["updated_at"]
    assert [e["event_type"] for e in _events(client, ticket["id"])] == ["created"]


def test_patch_assignee_null_unassigns_and_logs_event(client, make_ticket, agents):
    ticket = make_ticket(assignee_id=agents[1]["id"])

    resp = client.patch(
        f"/api/tickets/{ticket['id']}",
        json={"assignee_id": None, "actor_id": agents[0]["id"]},
    )
    assert resp.status_code == 200, resp.text

    got = client.get(f"/api/tickets/{ticket['id']}").json()
    assert got.get("assignee") is None
    types = [e["event_type"] for e in _events(client, ticket["id"])]
    assert "assignee_changed" in types


def test_patch_omitting_assignee_leaves_it_unchanged(client, make_ticket, agents):
    ticket = make_ticket(assignee_id=agents[1]["id"])

    client.patch(
        f"/api/tickets/{ticket['id']}",
        json={"priority": "low", "actor_id": agents[0]["id"]},
    )

    got = client.get(f"/api/tickets/{ticket['id']}").json()
    assert got["assignee"]["id"] == agents[1]["id"]


def test_patch_missing_ticket_returns_404(client, agents):
    resp = client.patch(
        "/api/tickets/99999",
        json={"status": "resolved", "actor_id": agents[0]["id"]},
    )
    assert resp.status_code == 404


def test_patch_invalid_status_rejected_and_nothing_changes(
    client, make_ticket, agents
):
    ticket = make_ticket()
    resp = client.patch(
        f"/api/tickets/{ticket['id']}",
        json={"status": "banana", "actor_id": agents[0]["id"]},
    )
    assert resp.status_code == 422
    assert client.get(f"/api/tickets/{ticket['id']}").json()["status"] == "open"


def test_patch_invalid_assignee_rejected_and_writes_no_event(
    client, make_ticket, agents
):
    ticket = make_ticket()
    resp = client.patch(
        f"/api/tickets/{ticket['id']}",
        json={"assignee_id": 999999, "actor_id": agents[0]["id"]},
    )
    assert resp.status_code == 422
    assert [e["event_type"] for e in _events(client, ticket["id"])] == ["created"]


# ------------------------------------------------------ replies and notes

def test_add_public_reply_and_internal_note_in_order(client, make_ticket, agents):
    ticket = make_ticket()
    author = agents[0]

    r1 = client.post(
        f"/api/tickets/{ticket['id']}/messages",
        json={"kind": "public_reply", "body": "We are looking into it.",
              "author_id": author["id"]},
    )
    r2 = client.post(
        f"/api/tickets/{ticket['id']}/messages",
        json={"kind": "internal_note", "body": "Customer seems on free plan.",
              "author_id": author["id"]},
    )
    assert r1.status_code == 201, r1.text
    assert r2.status_code == 201, r2.text

    messages = _messages(client, ticket["id"])
    assert [m["kind"] for m in messages] == ["public_reply", "internal_note"]
    assert messages[0]["body"] == "We are looking into it."
    assert messages[0]["author_name"] == author["name"]


def test_message_creates_event_and_bumps_updated_at(client, make_ticket, agents):
    ticket = make_ticket()
    before = _ts(client.get(f"/api/tickets/{ticket['id']}").json()["updated_at"])

    client.post(
        f"/api/tickets/{ticket['id']}/messages",
        json={"kind": "internal_note", "body": "Checking logs.",
              "author_id": agents[0]["id"]},
    )

    after = _ts(client.get(f"/api/tickets/{ticket['id']}").json()["updated_at"])
    assert after > before
    types = [e["event_type"] for e in _events(client, ticket["id"])]
    assert "note_added" in types


def test_public_reply_creates_reply_added_event(client, make_ticket, agents):
    ticket = make_ticket()
    client.post(
        f"/api/tickets/{ticket['id']}/messages",
        json={"kind": "public_reply", "body": "Hello!",
              "author_id": agents[0]["id"]},
    )
    types = [e["event_type"] for e in _events(client, ticket["id"])]
    assert "reply_added" in types


def test_message_blank_body_rejected(client, make_ticket, agents):
    ticket = make_ticket()
    resp = client.post(
        f"/api/tickets/{ticket['id']}/messages",
        json={"kind": "public_reply", "body": "   ", "author_id": agents[0]["id"]},
    )
    assert resp.status_code == 422
    assert _messages(client, ticket["id"]) == []


def test_message_invalid_kind_rejected(client, make_ticket, agents):
    ticket = make_ticket()
    resp = client.post(
        f"/api/tickets/{ticket['id']}/messages",
        json={"kind": "shout", "body": "hi", "author_id": agents[0]["id"]},
    )
    assert resp.status_code == 422


def test_message_on_missing_ticket_returns_404(client, agents):
    resp = client.post(
        "/api/tickets/99999/messages",
        json={"kind": "public_reply", "body": "hi", "author_id": agents[0]["id"]},
    )
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "ticket_not_found"


# ----------------------------------------------- list: search / filter / sort

def test_list_empty_returns_zero_items(client):
    resp = client.get("/api/tickets")
    assert resp.status_code == 200
    body = resp.json()
    assert body["items"] == []
    assert body["total"] == 0


def test_search_matches_subject_and_customer_case_insensitively(
    client, make_ticket
):
    make_ticket(subject="Invoice is wrong", customer_email="a@acme.io")
    make_ticket(subject="Cannot login", customer_email="b@other.io")

    by_subject = client.get("/api/tickets", params={"q": "INVOICE"}).json()
    by_customer = client.get("/api/tickets", params={"q": "ACME"}).json()

    assert [t["subject"] for t in by_subject["items"]] == ["Invoice is wrong"]
    assert [t["subject"] for t in by_customer["items"]] == ["Invoice is wrong"]


def test_search_treats_percent_literally_not_as_wildcard(client, make_ticket):
    make_ticket(subject="Plain subject")
    resp = client.get("/api/tickets", params={"q": "%"})
    # '%' must not match everything; it is a literal character.
    assert resp.status_code == 200
    assert resp.json()["total"] == 0


def test_combined_filters_return_only_the_intersection(
    client, make_ticket, set_status, agents
):
    target = make_ticket(subject="Billing issue", priority="urgent",
                         assignee_id=agents[0]["id"])
    make_ticket(subject="Billing issue", priority="urgent",
                assignee_id=agents[1]["id"])          # wrong assignee
    make_ticket(subject="Billing issue", priority="low",
                assignee_id=agents[0]["id"])          # wrong priority
    resolved = make_ticket(subject="Billing issue", priority="urgent",
                           assignee_id=agents[0]["id"])
    set_status(resolved["id"], "resolved")            # wrong status

    resp = client.get(
        "/api/tickets",
        params={
            "status": "open",
            "priority": "urgent",
            "assignee_id": agents[0]["id"],
            "q": "billing",
        },
    )
    assert resp.status_code == 200
    ids = [t["id"] for t in resp.json()["items"]]
    assert ids == [target["id"]]


def test_filter_multiple_statuses(client, make_ticket, set_status):
    a = make_ticket(subject="A")
    b = make_ticket(subject="B")
    c = make_ticket(subject="C")
    set_status(b["id"], "in_progress")
    set_status(c["id"], "resolved")

    resp = client.get(
        "/api/tickets", params=[("status", "open"), ("status", "in_progress")]
    )
    ids = {t["id"] for t in resp.json()["items"]}
    assert ids == {a["id"], b["id"]}


def test_filter_unassigned(client, make_ticket, agents):
    unassigned = make_ticket(subject="Nobody has this")
    make_ticket(subject="Taken", assignee_id=agents[0]["id"])

    resp = client.get("/api/tickets", params={"assignee_id": "unassigned"})
    assert [t["id"] for t in resp.json()["items"]] == [unassigned["id"]]


def test_unknown_filter_value_is_rejected_not_ignored(client):
    resp = client.get("/api/tickets", params={"status": "bogus"})
    assert resp.status_code == 422


def test_sort_by_priority_puts_urgent_first(client, make_ticket):
    for p in ["low", "urgent", "medium", "high"]:
        make_ticket(subject=f"{p} ticket", priority=p)

    resp = client.get("/api/tickets", params={"sort": "priority"})
    priorities = [t["priority"] for t in resp.json()["items"]]
    assert priorities == ["urgent", "high", "medium", "low"]


def test_sort_by_updated_puts_latest_activity_first(client, make_ticket, agents):
    first = make_ticket(subject="Older")
    second = make_ticket(subject="Newer")
    # Activity on the older ticket makes it the most recently updated.
    client.post(
        f"/api/tickets/{first['id']}/messages",
        json={"kind": "internal_note", "body": "bump", "author_id": agents[0]["id"]},
    )

    resp = client.get("/api/tickets", params={"sort": "updated"})
    ids = [t["id"] for t in resp.json()["items"]]
    assert ids[0] == first["id"]
    assert second["id"] in ids


def test_pagination_pages_do_not_overlap(client, make_ticket):
    for i in range(5):
        make_ticket(subject=f"Ticket {i}")

    p1 = client.get("/api/tickets", params={"page": 1, "page_size": 2}).json()
    p2 = client.get("/api/tickets", params={"page": 2, "page_size": 2}).json()
    p3 = client.get("/api/tickets", params={"page": 3, "page_size": 2}).json()

    assert p1["total"] == 5
    assert (len(p1["items"]), len(p2["items"]), len(p3["items"])) == (2, 2, 1)
    all_ids = [t["id"] for p in (p1, p2, p3) for t in p["items"]]
    assert len(all_ids) == len(set(all_ids)) == 5
