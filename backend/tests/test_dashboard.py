"""Dashboard counts must come from real saved data, never hardcoded."""

STATS_URL = "/api/dashboard/stats"


def test_empty_database_returns_all_zeros(client):
    resp = client.get(STATS_URL)
    assert resp.status_code == 200

    stats = resp.json()
    for key in ("total", "open", "in_progress", "resolved", "urgent", "overdue"):
        assert stats[key] == 0, key


def test_counts_match_seeded_data_exactly(
    client, make_ticket, set_status, backdate
):
    make_ticket(subject="t1 open medium")                                  # open
    make_ticket(subject="t2 open urgent", priority="urgent")               # open, urgent
    t3 = make_ticket(subject="t3 in progress", priority="high")
    set_status(t3["id"], "in_progress")
    t4 = make_ticket(subject="t4 waiting", priority="low")
    set_status(t4["id"], "waiting_on_customer")
    t5 = make_ticket(subject="t5 resolved urgent", priority="urgent")
    set_status(t5["id"], "resolved")                                       # urgent but resolved
    t6 = make_ticket(subject="t6 old open", priority="low")
    backdate(t6["id"], minutes=30 * 60)                                    # open + overdue
    t7 = make_ticket(subject="t7 old resolved", priority="low")
    set_status(t7["id"], "resolved")
    backdate(t7["id"], minutes=72 * 60)                                    # resolved, not overdue

    stats = client.get(STATS_URL).json()

    assert stats["total"] == 7
    assert stats["open"] == 3          # t1, t2, t6 (status = Open only)
    assert stats["in_progress"] == 1   # t3
    assert stats["resolved"] == 2      # t5, t7
    assert stats["urgent"] == 1        # t2 only: resolved urgent tickets excluded
    assert stats["overdue"] == 1       # t6 only


def test_resolving_ticket_removes_it_from_open_and_overdue(
    client, make_ticket, set_status, backdate
):
    ticket = make_ticket()
    backdate(ticket["id"], minutes=30 * 60)

    before = client.get(STATS_URL).json()
    assert (before["open"], before["overdue"], before["resolved"]) == (1, 1, 0)

    set_status(ticket["id"], "resolved")

    after = client.get(STATS_URL).json()
    assert (after["open"], after["overdue"], after["resolved"]) == (0, 0, 1)
    assert after["total"] == 1


def test_stats_react_to_new_tickets(client, make_ticket):
    assert client.get(STATS_URL).json()["total"] == 0
    make_ticket()
    make_ticket(priority="urgent")
    stats = client.get(STATS_URL).json()
    assert stats["total"] == 2
    assert stats["urgent"] == 1
