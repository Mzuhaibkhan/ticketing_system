"""Database seed script for demo agents and optional sample tickets.
Idempotent: safe to run multiple times.
"""

from datetime import datetime, timedelta, timezone
from app.db import SessionLocal
from app.models import (
    Agent,
    AgentRole,
    Ticket,
    TicketStatus,
    TicketPriority,
    TicketMessage,
    MessageKind,
    TicketEvent,
    EventType,
)
from app.core.auth import hash_password

DEMO_AGENTS = [
    {"name": "Admin User", "email": "admin@demo.local", "role": AgentRole.ADMIN, "password": "password123"},
    {"name": "Agent User", "email": "agent@demo.local", "role": AgentRole.AGENT, "password": "password123"},
    {"name": "Admin User", "email": "admin@example.com", "role": AgentRole.ADMIN, "password": "password123"},
    {"name": "Agent User", "email": "agent@example.com", "role": AgentRole.AGENT, "password": "password123"},
    {"name": "Sarah Chen", "email": "sarah@example.com", "role": AgentRole.ADMIN, "password": "password123"},
    {"name": "Alex Rivera", "email": "alex@example.com", "role": AgentRole.AGENT, "password": "password123"},
    {"name": "Maria Garcia", "email": "maria@example.com", "role": AgentRole.AGENT, "password": "password123"},
    {"name": "James Wilson", "email": "james@example.com", "role": AgentRole.AGENT, "password": "password123"},
]


def seed_database():
    db = SessionLocal()
    try:
        print("Checking & seeding agents...")
        agent_map = {}
        for agent_data in DEMO_AGENTS:
            existing = db.query(Agent).filter(Agent.email == agent_data["email"]).first()
            p_hash = hash_password(agent_data.get("password", "password123"))
            if not existing:
                agent = Agent(
                    name=agent_data["name"],
                    email=agent_data["email"],
                    role=agent_data["role"],
                    password_hash=p_hash,
                )
                db.add(agent)
                db.flush()
                agent_map[agent.email] = agent
                print(f"  + Created agent: {agent.name} ({agent.email})")
            else:
                existing.password_hash = p_hash
                agent_map[existing.email] = existing
                print(f"  = Existing agent: {existing.name} ({existing.email})")

        db.commit()

        # Seed sample tickets if empty
        ticket_count = db.query(Ticket).count()
        if ticket_count == 0:
            print("Seeding sample tickets...")
            now = datetime.now(timezone.utc)
            sarah = agent_map["sarah@example.com"]
            alex = agent_map["alex@example.com"]
            maria = agent_map["maria@example.com"]

            # 1. Urgent Overdue Ticket (>24h ago)
            t1_created = now - timedelta(hours=36)
            t1 = Ticket(
                subject="Production database connection pooling timeout",
                customer_name="Acme Corp Ops",
                customer_email="ops@acme.corp",
                description="We are seeing intermittent 500 errors across our production checkout pipeline. Connection pool exhausts within minutes.",
                status=TicketStatus.OPEN,
                priority=TicketPriority.URGENT,
                assignee_id=sarah.id,
                created_at=t1_created,
                updated_at=t1_created,
                version=1,
            )
            db.add(t1)
            db.flush()
            db.add(TicketEvent(
                ticket_id=t1.id,
                event_type=EventType.CREATED,
                actor_id=sarah.id,
                actor_name=sarah.name,
                new_value="Ticket created (open, urgent)",
                created_at=t1_created
            ))

            # 2. In-Progress High Priority Ticket
            t2_created = now - timedelta(hours=14)
            t2 = Ticket(
                subject="Billing discrepancy on Enterprise invoice #4920",
                customer_name="Starlight Financial",
                customer_email="finance@starlight.io",
                description="Our monthly invoice shows 250 seat licenses billed instead of the contracted 180 seats.",
                status=TicketStatus.IN_PROGRESS,
                priority=TicketPriority.HIGH,
                assignee_id=alex.id,
                created_at=t2_created,
                updated_at=now - timedelta(hours=2),
                version=1,
            )
            db.add(t2)
            db.flush()
            db.add(TicketEvent(
                ticket_id=t2.id,
                event_type=EventType.CREATED,
                actor_id=sarah.id,
                actor_name=sarah.name,
                new_value="Ticket created (open, high)",
                created_at=t2_created
            ))
            # Status changed to in_progress
            db.add(TicketEvent(
                ticket_id=t2.id,
                event_type=EventType.STATUS_CHANGED,
                actor_id=alex.id,
                actor_name=alex.name,
                old_value="open",
                new_value="in_progress",
                created_at=now - timedelta(hours=8)
            ))
            # Internal note
            db.add(TicketMessage(
                ticket_id=t2.id,
                kind=MessageKind.INTERNAL_NOTE,
                body="Checked Stripe account. A manual prorated tier adjustment was applied last month that did not reset.",
                author_id=alex.id,
                author_name=alex.name,
                created_at=now - timedelta(hours=2)
            ))
            db.add(TicketEvent(
                ticket_id=t2.id,
                event_type=EventType.NOTE_ADDED,
                actor_id=alex.id,
                actor_name=alex.name,
                new_value="Internal note added: Checked Stripe account...",
                created_at=now - timedelta(hours=2)
            ))

            # 3. Waiting on Customer Medium Priority Ticket
            t3_created = now - timedelta(hours=5)
            t3 = Ticket(
                subject="SSO SAML configuration failure with Okta",
                customer_name="Globex Corp IT",
                customer_email="it@globex.org",
                description="Metadata XML upload succeeds but authentication throws invalid assertion signature error.",
                status=TicketStatus.WAITING_ON_CUSTOMER,
                priority=TicketPriority.MEDIUM,
                assignee_id=maria.id,
                created_at=t3_created,
                updated_at=now - timedelta(hours=1),
                first_responded_at=now - timedelta(hours=1),
                version=1,
            )
            db.add(t3)
            db.flush()
            db.add(TicketEvent(
                ticket_id=t3.id,
                event_type=EventType.CREATED,
                actor_id=maria.id,
                actor_name=maria.name,
                new_value="Ticket created (open, medium)",
                created_at=t3_created
            ))
            # Public reply
            db.add(TicketMessage(
                ticket_id=t3.id,
                kind=MessageKind.PUBLIC_REPLY,
                body="Hello Globex IT team, could you please verify whether the X.509 certificate configured in Okta matches the one uploaded in your SAML settings? We are seeing a signature mismatch.",
                author_id=maria.id,
                author_name=maria.name,
                created_at=now - timedelta(hours=1)
            ))
            db.add(TicketEvent(
                ticket_id=t3.id,
                event_type=EventType.REPLY_ADDED,
                actor_id=maria.id,
                actor_name=maria.name,
                new_value="Public reply sent",
                created_at=now - timedelta(hours=1)
            ))

            # 4. Resolved Ticket with resolved_at set
            t4_created = now - timedelta(hours=48)
            t4_resolved = now - timedelta(hours=20)
            t4 = Ticket(
                subject="Password reset email not delivering to hotmail.com addresses",
                customer_name="David Miller",
                customer_email="david.m@hotmail.com",
                description="Customer requested password reset 3 times over 2 hours but received no reset link.",
                status=TicketStatus.RESOLVED,
                priority=TicketPriority.LOW,
                assignee_id=sarah.id,
                created_at=t4_created,
                updated_at=t4_resolved,
                resolved_at=t4_resolved,
                first_responded_at=t4_created + timedelta(hours=2),
                version=1,
            )
            db.add(t4)
            db.flush()
            db.add(TicketEvent(
                ticket_id=t4.id,
                event_type=EventType.CREATED,
                actor_id=sarah.id,
                actor_name=sarah.name,
                new_value="Ticket created (open, low)",
                created_at=t4_created
            ))
            db.add(TicketEvent(
                ticket_id=t4.id,
                event_type=EventType.STATUS_CHANGED,
                actor_id=sarah.id,
                actor_name=sarah.name,
                old_value="open",
                new_value="resolved",
                created_at=t4_resolved
            ))

            # 5. Fresh Unassigned Ticket
            t5_created = now - timedelta(minutes=45)
            t5 = Ticket(
                subject="Unable to export customer report to CSV format",
                customer_name="Wayne Enterprises",
                customer_email="reports@wayne.com",
                description="Clicking 'Export CSV' triggers a 400 bad request error when the date range exceeds 90 days.",
                status=TicketStatus.OPEN,
                priority=TicketPriority.MEDIUM,
                assignee_id=None,
                created_at=t5_created,
                updated_at=t5_created,
                version=1,
            )
            db.add(t5)
            db.flush()
            db.add(TicketEvent(
                ticket_id=t5.id,
                event_type=EventType.CREATED,
                actor_id=None,
                actor_name="System",
                new_value="Ticket created (open, medium)",
                created_at=t5_created
            ))

            db.commit()
            print("Successfully seeded 5 sample tickets!")
        else:
            print(f"Database already contains {ticket_count} tickets. Skipping sample ticket seed.")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
