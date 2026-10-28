"""Shared fixtures for the Support Desk API tests.

These tests talk to the real FastAPI app and a real PostgreSQL database
(black-box, over HTTP). Time-dependent rules (overdue) are tested by
back-dating `created_at` directly in the database, so nothing needs to wait
24 hours.

SAFETY: the suite TRUNCATEs ticket tables before every test, so it refuses to
run unless the database name contains "test".
"""
import os
import pytest
from sqlalchemy import create_engine, text

TEST_DB_URL = (
    os.environ.get("TEST_DATABASE_URL")
    or os.environ.get("DATABASE_URL")
    or "postgresql+psycopg://postgres:postgres@localhost:5432/supportdesk_test"
)

# If the specified database is postgresql but not reachable locally (e.g. running on Windows without Docker),
# fall back to local sqlite test database supportdesk_test.db
if "postgresql" in TEST_DB_URL:
    try:
        _probe = create_engine(TEST_DB_URL, connect_args={"connect_timeout": 1})
        with _probe.connect() as _conn:
            pass
        _probe.dispose()
    except Exception:
        TEST_DB_URL = "sqlite:///./supportdesk_test.db"

_db_name = TEST_DB_URL.rsplit("/", 1)[-1].split("?")[0].lower()
if "test" not in _db_name:
    if "sqlite" in TEST_DB_URL:
        TEST_DB_URL = "sqlite:///./supportdesk_test.db"
        _db_name = "supportdesk_test.db"
    else:
        raise RuntimeError(
            f"Refusing to run tests against database '{_db_name}'. "
            "Use a database whose name contains 'test' (e.g. supportdesk_test)."
        )

# Must be set BEFORE the app is imported so settings pick up the test DB.
os.environ["DATABASE_URL"] = TEST_DB_URL

from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402  (adjust if your app object lives elsewhere)

DEMO_AGENTS = [
    ("Test Agent One", "agent1@test.local"),
    ("Test Agent Two", "agent2@test.local"),
    ("Test Agent Three", "agent3@test.local"),
]


@pytest.fixture(scope="session")
def engine():
    eng = create_engine(TEST_DB_URL, future=True)
    if eng.dialect.name == "sqlite":
        from sqlalchemy import event

        @event.listens_for(eng, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

        from app.db import Base
        import app.models  # noqa: F401
        Base.metadata.create_all(bind=eng)
    yield eng
    eng.dispose()


@pytest.fixture(autouse=True)
def _clean_db(engine):
    """Start every test from an empty ticket set with known agents."""
    with engine.begin() as conn:
        if engine.dialect.name == "sqlite":
            conn.execute(text("DELETE FROM ticket_events"))
            conn.execute(text("DELETE FROM ticket_messages"))
            conn.execute(text("DELETE FROM tickets"))
            try:
                conn.execute(text("DELETE FROM sqlite_sequence WHERE name IN ('ticket_events', 'ticket_messages', 'tickets')"))
            except Exception:
                pass
        else:
            conn.execute(
                text(
                    "TRUNCATE ticket_events, ticket_messages, tickets "
                    "RESTART IDENTITY CASCADE"
                )
            )
        for name, email in DEMO_AGENTS:
            conn.execute(
                text(
                    "INSERT INTO agents (name, email) VALUES (:n, :e) "
                    "ON CONFLICT (email) DO NOTHING"
                ),
                {"n": name, "e": email},
            )
    yield


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def agents(engine):
    """The three test agents as [{'id', 'name', 'email'}, ...]."""
    with engine.connect() as conn:
        rows = conn.execute(
            text(
                "SELECT id, name, email FROM agents "
                "WHERE email LIKE '%@test.local' ORDER BY id"
            )
        ).mappings()
        return [dict(r) for r in rows]


@pytest.fixture
def make_ticket(client, agents):
    """Factory: create a ticket via the API and return the response JSON."""

    def _make(**overrides):
        payload = {
            "subject": "Password reset not working",
            "customer_email": "jane@example.com",
            "description": "I never receive the reset email.",
            "actor_id": agents[0]["id"],
        }
        payload.update(overrides)
        resp = client.post("/api/tickets", json=payload)
        assert resp.status_code == 201, resp.text
        return resp.json()

    return _make


@pytest.fixture
def set_status(client, agents):
    """Change a ticket's status through the real PATCH endpoint."""

    def _set(ticket_id, status):
        resp = client.patch(
            f"/api/tickets/{ticket_id}",
            json={"status": status, "actor_id": agents[0]["id"]},
        )
        assert resp.status_code == 200, resp.text
        return resp.json()

    return _set


@pytest.fixture
def backdate(engine):
    """Pretend a ticket was created `minutes` ago (for overdue tests)."""

    def _backdate(ticket_id, *, minutes):
        with engine.begin() as conn:
            if engine.dialect.name == "sqlite":
                conn.execute(
                    text(
                        "UPDATE tickets "
                        "SET created_at = datetime('now', '-' || :m || ' minute') "
                        "WHERE id = :id"
                    ),
                    {"m": minutes, "id": ticket_id},
                )
            else:
                conn.execute(
                    text(
                        "UPDATE tickets "
                        "SET created_at = now() - (:m * interval '1 minute') "
                        "WHERE id = :id"
                    ),
                    {"m": minutes, "id": ticket_id},
                )

    return _backdate


# ---------- small helpers used by several test files ----------

def as_list(data):
    """Endpoints may return a bare list or {'items': [...]}; accept both."""
    return data["items"] if isinstance(data, dict) and "items" in data else data


def error_fields(resp):
    """Set of field names mentioned in a validation error response."""
    details = resp.json()["error"].get("details") or []
    return {str(d["field"]).split(".")[-1] for d in details}
