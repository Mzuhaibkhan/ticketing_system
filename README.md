# Support Desk System

A production-grade, full-featured customer support desk system built with **FastAPI**, **PostgreSQL 16**, **Next.js 16 (App Router)**, **TypeScript**, and **Tailwind CSS**.

Designed specifically for agent support workflows: triage, fast multi-select filtering, URL-persisted filter states, dual-channel conversations (public replies vs. internal notes), automated diff-based audit history, and real-time SLA overdue calculations.

---

## Table of Contents

- [Overview & Architecture](#overview--architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quickstart Setup (Under 5 Minutes)](#quickstart-setup-under-5-minutes)
- [Environment Variables](#environment-variables)
- [Database Schema & Migrations](#database-schema--migrations)
- [Demo Agents & Sample Data](#demo-agents--sample-data)
- [Deliberate Product & Technical Assumptions](#deliberate-product--technical-assumptions)
- [What Works, Incomplete & Known Issues](#what-works-incomplete--known-issues)
- [AI Usage & Attribution](#ai-usage--attribution)
- [Running Automated Tests](#running-automated-tests)
- [10-Minute Walkthrough Order](#10-minute-walkthrough-order)

---

## Overview & Architecture

### Backend Layering
```
HTTP Requests
      │
      ▼
 Routers (HTTP parsing, query params, status codes, OpenAPI docs)
      │
      ▼
 Services (Business rules, diff detection, single-transaction commits, overdue logic)
      │
      ▼
 SQLAlchemy ORM Models & DB (PostgreSQL 16 / SQLite fallback, CHECK constraints, FK cascade)
```

- **Separation of Concerns**: Pydantic schemas validate requests at the HTTP router boundary. The business logic lives exclusively in the service layer (`ticket_service`, `message_service`, `dashboard_service`).
- **Atomic History Logging**: The `update_ticket()` service loads the ticket with row locking (`SELECT ... FOR UPDATE`), diffs old values against new values, appends one discrete `TicketEvent` per changed tracked field (`status`, `priority`, `assignee_id`), bumps `updated_at`, and commits once in a single transaction.
- **Unified Overdue Rule**: A single shared expression `overdue_clause(now)` feeds:
  1. The `?overdue=true` query filter
  2. The single aggregate dashboard counter query
  3. The per-row computed `is_overdue` flag returned in every ticket response

### Request Flow for an Update
1. Client selects a new Status, Priority, or Assignee in the UI properties panel.
2. The UI sends a partial `PATCH /api/tickets/{id}` containing only modified fields and the `actor_id` of the acting agent.
3. The router validates the payload against `TicketUpdate` (using `model_dump(exclude_unset=True)` to distinguish "omitted field" from "field set to null").
4. The service performs row diffing, records audit events, bumps `updated_at`, and commits.
5. The API returns the fresh ticket with re-computed `is_overdue` and `age_hours`.
6. TanStack Query invalidates `['ticket', id]`, `['events', id]`, `['tickets']`, and `['dashboard']`, keeping every screen instantly synchronized.

---

## Tech Stack

| Layer | Choice | Why Chosen |
|---|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript | High-performance client components, partial prerendering, type safety |
| **Styling** | Tailwind CSS v4, Lucide Icons | Clean modern SaaS design, accessible badge iconography, responsive layouts |
| **Forms & Validation** | `react-hook-form` + `zod` | Client-side validation mirroring server schemas with inline error mapping |
| **Server State** | TanStack Query v5 | Cache management, optimistic updates, automatic query invalidation |
| **Toast Notifications** | `sonner` | Rich non-blocking user feedback on auto-saves and mutations |
| **Backend** | FastAPI + Pydantic v2 | High-speed async ASGI framework, OpenAPI documentation, strict request validation |
| **ORM & Migrations** | SQLAlchemy 2.0 + Alembic | Transactional safety, relationship cascades, versioned schema migrations |
| **Database** | PostgreSQL 16 (via Docker Compose) | ACID guarantees, enums, DB-level `CHECK` constraints, named volume persistence |
| **Python Tooling** | `uv` | Fast virtual environment and deterministic dependency locking |
| **Testing** | `pytest` + `httpx` (`TestClient`) | Fast integration and business rule test suite with rollback isolation |

---

## Prerequisites

- **Docker & Docker Compose** (for PostgreSQL 16)
- **Node.js 20+** & **npm**
- **Python 3.12+** & **`uv`** (fast Python package manager: `curl -LsSf https://astral.sh/uv/install.sh | sh` or `pip install uv`)

---

## Quickstart Setup (Under 5 Minutes)

### Step 1: Start PostgreSQL Database
```bash
docker compose up -d db
```

### Step 2: Backend Setup & Seed
```bash
cd backend
cp .env.example .env
uv sync
uv run alembic upgrade head
uv run python -m app.seed
uv run uvicorn app.main:app --reload --port 8000
```
> **Fallback**: If Docker is unavailable, set `DATABASE_URL=sqlite:///./supportdesk.db` in `backend/.env`. All SQLAlchemy queries and migrations seamlessly support SQLite.

### Step 3: Frontend Setup (New Terminal)
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

### Step 4: Access Applications
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API & Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default Value | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql+psycopg2://postgres:postgres@localhost:5432/supportdesk` | PostgreSQL connection string (`sqlite:///./supportdesk.db` for SQLite) |
| `CORS_ORIGINS` | `["http://localhost:3000", "http://127.0.0.1:3000"]` | Allowed browser origins for CORS middleware |
| `OVERDUE_HOURS` | `24` | SLA response threshold in hours |
| `APP_ENV` | `development` | Runtime environment name |

### Frontend (`frontend/.env.local`)

| Variable | Default Value | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api` | Base URL for backend REST API endpoints |

---

## Database Schema & Migrations

Four relational tables configured with cascading constraints:

```
┌──────────────────┐           ┌──────────────────┐
│      agents      │           │     tickets      │
├──────────────────┤           ├──────────────────┤
│ id (PK)          │           │ id (PK)          │
│ name             │◄────┐     │ subject          │
│ email (UQ)       │     │     │ customer_name    │
│ role (enum)      │     │     │ customer_email   │
└──────────────────┘     │     │ description      │
                         │     │ status (enum)    │
                         ├─────┼─assignee_id (FK) │
                         │     │ priority (enum)  │
                         │     │ created_at       │
                         │     │ updated_at       │
                         │     │ resolved_at      │
                         │     └────────┬─────────┘
                         │              │
                         │              │ 1:N (CASCADE)
                         │              ├────────────────────────┐
                         │              ▼                        ▼
               ┌─────────┴──────────────┴┐      ┌────────────────┴────────┐
               │     ticket_messages     │      │      ticket_events      │
               ├─────────────────────────┤      ├─────────────────────────┤
               │ id (PK)                 │      │ id (PK)                 │
               │ ticket_id (FK CASCADE)  │      │ ticket_id (FK CASCADE)  │
               │ kind (enum reply/note)  │      │ event_type (enum)       │
               │ body                    │      │ actor_id (FK SET NULL)  │
               │ author_id (FK SET NULL) │      │ actor_name (snapshot)   │
               │ author_name (snapshot)  │      │ old_value               │
               │ created_at              │      │ new_value               │
               └─────────────────────────┘      │ details (JSONB/dict)    │
                                                │ created_at              │
                                                └─────────────────────────┘
```

- **`tickets`**: Contains customer identifier check constraint: `CHECK (customer_name IS NOT NULL OR customer_email IS NOT NULL)` and trimmed subject check constraint.
- **`ticket_messages`**: Single table storing both public replies and internal notes with discriminator `kind`. Preserves `author_name` as an immutable snapshot.
- **`ticket_events`**: Append-only audit history table recording every status, priority, and assignee change with `old_value` and `new_value`.
- **Database Migrations**: Run with:
  ```bash
  uv run alembic upgrade head
  ```

---

## Demo Agents & Sample Data

The seed script (`python -m app.seed`) is idempotent and populates demo staff and tickets:

### Pre-Seeded Agents
- **Sarah Chen** (`sarah@example.com`) — *Admin*
- **Alex Rivera** (`alex@example.com`) — *Agent*
- **Maria Garcia** (`maria@example.com`) — *Agent*
- **James Wilson** (`james@example.com`) — *Agent*

> The UI includes an **"Acting as"** agent selector in the header (persisted in `localStorage`). Changing the active agent dynamically authors all replies, notes, and audit events as that agent.

---

## Deliberate Product & Technical Assumptions

1. **Customer Identifier**: Either `customer_name` or `customer_email` is required (or both). Enforced simultaneously on the client (Zod refine), server (Pydantic model validator), and database (`CHECK` constraint).
2. **Dashboard "Open" vs "Unresolved"**:
   - "Open Tickets" card counts strictly `status = 'open'`.
   - The dashboard also exposes `unresolved` (`open + in_progress + waiting_on_customer`) so neither reading is ambiguous.
3. **Overdue Invariant**: Overdue is strictly `status != 'resolved'` AND `created_at < now - 24 hours`. Evaluated at read time so it never goes stale. Tickets created exactly 24h00m ago are not overdue (strictly more than 24 hours).
4. **Status Transitions & Reopening**: Any status can move to any other. Setting a ticket to `resolved` populates `resolved_at = now()`; reopening a resolved ticket clears `resolved_at` to `null` and logs a status change event.
5. **Urgent Assumption**: Dashboard urgent count only tallies **unresolved** urgent tickets (a resolved urgent ticket requires no immediate queue attention). The dashboard urgent card links directly to `/tickets?priority=urgent&status=open&status=in_progress&status=waiting_on_customer` so card counts match list rows.
6. **Deletion & Cascades**: Core exposes no `DELETE` endpoint. Foreign keys use `ON DELETE CASCADE` on tickets so manual or automated cleanup leaves no orphaned messages or events.
7. **Bumping Activity**: Adding a public reply or internal note immediately bumps `updated_at` on the ticket, keeping the "Recently updated" sort accurate.

---

## What Works, Incomplete & Known Issues

### What Works
- **Complete Agent Workflow**: Create tickets, triage status/priority, assign/unassign agents, post public replies, and add private internal notes.
- **Properties Auto-Save**: Status, priority, and assignee selects in the detail view save on change via `PATCH /api/tickets/{id}`, showing per-field spinner feedback and reverting on network error.
- **Visual Safety**:
  - Internal notes render in an amber container with dashed borders, lock icon, and a prominent private banner.
  - Composer automatically switches to amber styling with button label "Add internal note" when the note tab is active, preventing accidental customer leaks.
  - Overdue tickets display an alert badge and a prominent red left border.
- **URL-Persisted Filtering**: All filters (300ms debounced search, multi-select status, multi-select priority, assignee, overdue toggle, sort order) live in URL parameters, supporting browser history and deep-linking.
- **Dual Empty States**: Distinct states for "No tickets yet — create one" vs "No tickets match these filters — clear filters".

### Incomplete / Known Issues
1. **Actor ID Spoofing**: Since core implementation relies on the "Acting as" picker in `localStorage`, the client sends `actor_id` in request payloads. In an enterprise production build, this would be replaced with a secure `httpOnly` JWT session cookie and a FastAPI `current_user` dependency.
2. **Full-Text Search Scaling**: The search filter uses SQL `ILIKE` on `subject`, `customer_name`, and `customer_email`. For multi-million row scale, a PostgreSQL `pg_trgm` GIN index or dedicated search engine (Elasticsearch/Meilisearch) would be introduced.
3. **Optimistic Locking**: Concurrent updates use last-write-wins with single-transaction row diffing. Production extension would include an `ETag` / `If-Match` header on `updated_at` returning `409 Conflict` on mid-air collisions.

---

## AI Usage & Attribution

- **What was AI-Generated**:
  - Starter boilerplate for FastAPI routers and Pydantic schemas.
  - Initial Next.js component templates and Tailwind CSS color tokens.
  - Baseline pytest test scaffolding.
- **What was Reviewed & Refined**:
  - Extracted the unified `overdue_clause(now)` expression so filter queries, dashboard counts, and response models never drift from business rules.
  - Implemented exact field-level diff detection in `ticket_service.update_ticket()` so that no-op requests write 0 events and identical values do not bump `updated_at`.
  - Added multi-value enum parsing in FastAPI tickets router to gracefully accept both repeated (`?status=open&status=in_progress`) and comma-separated query parameters.
- **Bug Caught in AI-Generated Code**:
  - In Next.js 16 with Partial Prerendering enabled, using `usePathname()`, `useParams()`, and `useSearchParams()` outside of `<Suspense>` boundaries caused static export prerender crashes during `npm run build`. Fixed by introducing explicit Suspense fallback boundaries around all navigation and dynamic page components.

---

## Running Automated Tests

A dedicated pytest suite tests business rules, edge cases, and boundaries:

```bash
cd backend
uv run pytest -v
```

### Test Coverage (11 Passing Tests in ~0.2s)
```text
tests/test_dashboard.py::test_dashboard_counts PASSED              [ 9%]
tests/test_rules.py::test_overdue_boundary PASSED                  [18%]
tests/test_rules.py::test_resolved_not_overdue PASSED              [27%]
tests/test_rules.py::test_patch_writes_history PASSED              [36%]
tests/test_rules.py::test_patch_noop_no_history PASSED             [45%]
tests/test_rules.py::test_message_bumps_updated_at PASSED          [54%]
tests/test_tickets.py::test_create_ticket_missing_fields PASSED    [63%]
tests/test_tickets.py::test_create_ticket_success PASSED           [72%]
tests/test_tickets.py::test_get_missing_ticket PASSED              [81%]
tests/test_tickets.py::test_combined_filters PASSED                [90%]
tests/test_tickets.py::test_assignee_not_found_returns_422 PASSED  [100%]
```

---

## 10-Minute Walkthrough Order

1. **Assumptions & Core Principles (30s)**:
   - Walk through the assumptions in the README: customer identifier rule, read-time overdue calculation, and actor tracking.
2. **Live Workflow Demo (5m)**:
   - **Ticket Creation**: Attempt creation with missing fields to demonstrate inline validation; complete a valid ticket and observe redirect to ticket detail.
   - **Triage & Auto-Save**: In the properties panel, change status, priority, and assignee; observe instant saving feedback and append-only activity timeline updates.
   - **Communication**: Add a public reply (white card), then toggle to an internal note (amber dashed card with safety banner); show `updated_at` bump.
   - **Filters & Search**: Navigate to `/tickets`, test 300ms debounced search, combine status/priority filters, toggle "Overdue only", and verify URL query persistence.
   - **Dashboard**: Visit `/` and demonstrate that stat cards deep-link to pre-filtered lists with matching counts.
3. **Database Schema & Cascade Decision (2m)**:
   - Explain why messages share one table with discriminator `kind`.
   - Explain why author/actor names are snapshotted to preserve readability even if agents are deleted.
4. **Automated Verification & Resilience (2m)**:
   - Run `uv run pytest -v` to prove the 24h boundary, resolved exclusions, and diff tracking.
   - Restart the database container (`docker compose restart db`) to demonstrate full data persistence.
