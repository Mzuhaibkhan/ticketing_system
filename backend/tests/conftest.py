import sys
from pathlib import Path
import pytest

# Ensure backend root is in sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from datetime import datetime, timezone
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.db import Base, get_db
from app.main import create_app
from app.models import Agent, AgentRole, Ticket, TicketMessage, TicketEvent


# In-memory SQLite with StaticPool so all connections share the same memory instance
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create schema once
Base.metadata.create_all(bind=engine)


@pytest.fixture(scope="session")
def app_instance():
    app = create_app()

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    return app


@pytest.fixture(autouse=True)
def clean_db():
    """Ensure a clean database state before each test run."""
    with engine.begin() as conn:
        conn.execute(text("DELETE FROM ticket_messages"))
        conn.execute(text("DELETE FROM ticket_events"))
        conn.execute(text("DELETE FROM tickets"))
        conn.execute(text("DELETE FROM agents"))

    # Seed standard test agents
    db = TestingSessionLocal()
    sarah = Agent(name="Sarah Chen", email="sarah@example.com", role=AgentRole.ADMIN)
    alex = Agent(name="Alex Rivera", email="alex@example.com", role=AgentRole.AGENT)
    maria = Agent(name="Maria Garcia", email="maria@example.com", role=AgentRole.AGENT)
    db.add_all([sarah, alex, maria])
    db.commit()
    db.close()


@pytest.fixture
def db_session():
    """Provide a direct DB session for inspecting DB state in tests."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def test_agents(db_session: Session):
    """Return dictionary of seeded agents keyed by email."""
    agents = db_session.query(Agent).all()
    return {a.email: a for a in agents}


@pytest.fixture
def client(app_instance):
    """Provide FastAPI TestClient."""
    with TestClient(app_instance) as c:
        yield c
