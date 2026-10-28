# Support Desk System

A high-performance, robust, and full-featured customer support ticketing system designed for agent workflows. Built with FastAPI (Python 3.12+), Next.js (App Router, TypeScript, Tailwind CSS, shadcn/ui), and PostgreSQL.

---

## Assumptions & Design Decisions

The brief leaves several product and technical choices open. These assumptions are deliberate:

1. **Customer Identifier**:
   - Two optional fields: `customer_name` and `customer_email`.
   - At least one is strictly required (enforced both at the API boundary via Pydantic and at the database level with a `CHECK` constraint: `CHECK (customer_name IS NOT NULL OR customer_email IS NOT NULL)`).
2. **"Open Tickets" Definition**:
   - On the dashboard, "Open Tickets" strictly means `status = 'open'`.
   - A separate "Unresolved" metric (`open` + `in_progress` + `waiting_on_customer`) is provided so neither interpretation is missed.
3. **Overdue Calculation**:
   - Overdue is calculated dynamically at read time from `created_at` (strictly greater than `OVERDUE_HOURS`, default 24h) and only applies to non-resolved tickets (`status != 'resolved'`).
   - It is never stored as a persistent column to avoid stale data.
   - All server operations and timestamps are in UTC.
4. **Status Transitions & Reopening**:
   - Any status can transition to any other status.
   - Transitioning to `resolved` sets `resolved_at = now()`.
   - Reopening a `resolved` ticket (moving to `open`, `in_progress`, or `waiting_on_customer`) clears `resolved_at` (sets to `NULL`) and records an event in the audit trail.
5. **Agent Identity & Authentication**:
   - Agents are seeded in an `agents` table (no auth in core).
   - The UI includes an "Acting as" agent picker in the header; the active agent ID is persisted in `localStorage` and sent with requests as `actor_id` (or `X-Agent-Id`), recording the agent as author of replies, internal notes, and audit events.
6. **Deletion Policy**:
   - Core API exposes no `DELETE` endpoint.
   - Foreign keys use `ON DELETE CASCADE` (for messages and events) and `ON DELETE SET NULL` (for assignee) so database integrity is strictly maintained. Soft delete (`deleted_at`) is the enterprise compliance path.
7. **Message Types (Replies vs. Notes)**:
   - Stored in a single `ticket_messages` table with discriminator `kind` (`public_reply` vs. `internal_note`).
   - Public replies are customer-visible in concept (no email sending service required in core).
   - Internal notes are strictly for agent internal collaboration.
8. **Activity & Audit Trail**:
   - Adding a reply or note updates `updated_at` on the ticket, naturally keeping the "recently updated" sort accurate.
   - Every status, priority, or assignee change logs a discrete `ticket_events` entry in a single atomic transaction.

---

## Tech Stack

- **Backend**: FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, PostgreSQL 16 (with SQLite fallback)
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, react-hook-form + zod
- **DevOps / Tooling**: uv, Docker Compose

---

## Quickstart (Development)

### Prerequisites
- Docker & Docker Compose
- Python 3.12+ & `uv`
- Node.js 20+ & `npm`

### Setup Instructions
```bash
# 1. Start PostgreSQL
docker compose up -d db

# 2. Setup and run Backend
cd backend
cp .env.example .env
uv sync
uv run alembic upgrade head
uv run python -m app.seed
uv run uvicorn app.main:app --reload --port 8000

# 3. Setup and run Frontend (in another terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

---

## Verification & Health Check

The backend exposes a health check endpoint:
- `GET http://localhost:8000/api/health` -> `{ "status": "ok", "database": "connected" }`

