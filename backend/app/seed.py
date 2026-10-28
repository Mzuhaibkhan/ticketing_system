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

DEMO_AGENTS = [
    {"name": "Sarah Chen", "email": "sarah@example.com", "role": AgentRole.ADMIN},
    {"name": "Alex Rivera", "email": "alex@example.com", "role": AgentRole.AGENT},
    {"name": "Maria Garcia", "email": "maria@example.com", "role": AgentRole.AGENT},
    {"name": "James Wilson", "email": "james@example.com", "role": AgentRole.AGENT},
]


def seed_database():
    db = SessionLocal()
    try:
        print("Checking & seeding agents...")
        agent_map = {}
        for agent_data in DEMO_AGENTS:
            existing = db.query(Agent).filter(Agent.email == agent_data["email"]).first()
            if not existing:
                agent = Agent(
                    name=agent_data["name"],
                    email=agent_data["email"],
                    role=agent_data["role"],
                )
                db.add(agent)
                db.flush()
                agent_map[agent.email] = agent
                print(f"  + Created agent: {agent.name} ({agent.email})")
            else:
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
            t1 = Ticket(
                subject="Payment gateway returning 500 on checkout",
                customer_name="Acme Corp",
                customer_email="billing@acmecorp.com",
                description="Customers are complaining that checkout fails when attempting credit card payments.",
                status=TicketStatus.OPEN,
                priority=TicketPriority.URGENT,
                assignee_id=sarah.id,
                created_at=now - timedelta(hours=30),
                updated_at=now - timedelta(hours=30),
            )
            db.add(t1)
            db.flush()
            db.add(TicketEvent(
                ticket_id=t1.id,
                event_type=EventType.CREATED,
                actor_id=sarah.id,
                actor_name=sarah.name,
                created_at=t1.created_at
            ))

            # 2. In Progress Ticket with conversation
            t2 = Ticket(
                subject="Cannot invite new members to organization workspace",
                customer_name="TechStart Inc",
                customer_email="admin@techstart.io",
                description="The invite button gives an error: 'Organization seat quota exceeded' even though we only have 3 active users.",
                status=TicketStatus.IN_PROGRESS,
                priority=TicketPriority.HIGH,
                assignee_id=alex.id,
                created_at=now - timedelta(hours=5),
                updated_at=now - timedelta(hours=1),
            )
            db.add(t2)
            db.flush()
            db.add(TicketEvent(
                ticket_id=t2.id,
                event_type=EventType.CREATED,
                actor_id=alex.id,
                actor_name=alex.name,
                created_at=t2.created_at
            ))
            # Internal note
            msg1 = TicketMessage(
                ticket_id=t2.id,
                kind=MessageKind.INTERNAL_NOTE,
                body="Checked license DB, their license cache is out of sync. Need to trigger manual cache refresh.",
                author_id=alex.id,
                author_name=alex.name,
                created_at=now - timedelta(hours=2)
            )
            db.add(msg1)
            db.add(TicketEvent(
                ticket_id=t2.id,
                event_type=EventType.NOTE_ADDED,
                actor_id=alex.id,
                actor_name=alex.name,
                created_at=msg1.created_at
            ))
            # Public reply
            msg2 = TicketMessage(
                ticket_id=t2.id,
                kind=MessageKind.PUBLIC_REPLY,
                body="Hello, we are investigating the seat sync error on your account and will have an update shortly.",
                author_id=alex.id,
                author_name=alex.name,
                created_at=now - timedelta(hours=1)
            )
            db.add(msg2)
            db.add(TicketEvent(
                ticket_id=t2.id,
                event_type=EventType.REPLY_ADDED,
                actor_id=alex.id,
                actor_name=alex.name,
                created_at=msg2.created_at
            ))

            # 3. Unassigned Open ticket
            t3 = Ticket(
                subject="Feature request: Webhook notifications for ticket resolution",
                customer_name="DevTools Ltd",
                customer_email="integrations@devtools.com",
                description="We want to integrate automated Slack alerts when tickets are resolved.",
                status=TicketStatus.OPEN,
                priority=TicketPriority.LOW,
                assignee_id=None,
                created_at=now - timedelta(hours=8),
                updated_at=now - timedelta(hours=8),
            )
            db.add(t3)
            db.flush()
            db.add(TicketEvent(
                ticket_id=t3.id,
                event_type=EventType.CREATED,
                actor_id=None,
                actor_name="System",
                created_at=t3.created_at
            ))

            # 4. Resolved ticket
            t4 = Ticket(
                subject="Password reset email link expired",
                customer_name="Jane Doe",
                customer_email="jane.doe@example.org",
                description="The password reset link says expired right after receiving it.",
                status=TicketStatus.RESOLVED,
                priority=TicketPriority.MEDIUM,
                assignee_id=maria.id,
                created_at=now - timedelta(days=2),
                updated_at=now - timedelta(days=1),
                resolved_at=now - timedelta(days=1),
            )
            db.add(t4)
            db.flush()
            db.add(TicketEvent(
                ticket_id=t4.id,
                event_type=EventType.CREATED,
                actor_id=maria.id,
                actor_name=maria.name,
                created_at=t4.created_at
            ))
            db.add(TicketEvent(
                ticket_id=t4.id,
                event_type=EventType.STATUS_CHANGED,
                actor_id=maria.id,
                actor_name=maria.name,
                old_value="open",
                new_value="resolved",
                created_at=now - timedelta(days=1)
            ))

            db.commit()
            print("  + Sample tickets and conversation threads seeded successfully!")
        else:
            print(f"  = Found {ticket_count} existing tickets, skipping demo ticket seed.")

        print("Seeding complete.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

