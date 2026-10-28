# Support Desk System

A production-grade customer support desk application built with FastAPI, PostgreSQL 16, Next.js 16 (App Router), TypeScript, and Tailwind CSS.

Designed specifically for customer support workflows: queue triage, multi-criteria filtering with URL state persistence, dual-channel communication (public customer replies and private internal notes), automated field-level audit history, and real-time SLA overdue calculations.

---

## Table of Contents

- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quickstart Setup](#quickstart-setup)
- [Demo Credentials](#demo-credentials)
- [Implemented Stretch Goals](#implemented-stretch-goals)
- [Environment Variables](#environment-variables)
- [Database Schema and Relationships](#database-schema-and-relationships)
- [Backend Architecture](#backend-architecture)
- [Frontend Architecture and Design System](#frontend-architecture-and-design-system)
- [Business Rules and Invariants](#business-rules-and-invariants)
- [Continuous Integration (GitHub Actions)](#continuous-integration-github-actions)
- [Automated Testing](#automated-testing)
- [Deliberate Product and Technical Decisions](#deliberate-product-and-technical-decisions)
- [Walkthrough Guide](#walkthrough-guide)

---

## System Architecture

```
                    +--------------------------------------------+
                    |           Next.js 16 Frontend              |
                    |    (App Router, React 19, TypeScript)      |
                    +--------------------------------------------+
                                   |              ^
                    HTTP / JSON    |              | TanStack Query Cache
                    REST API Calls |              | Invalidation
                                   v              |
                    +--------------------------------------------+
                    |             FastAPI Backend                |
                    |  (Pydantic v2, Uniform Error Handler, CORS)|
                    +--------------------------------------------+
                      |                        |
                      | Routers                | Services
                      v                        v
             +------------------+     +-------------------------------+
             | /api/auth (JWT)  |     | auth (bcrypt + JWT decoder)   |
             | /api/tickets     |     | ticket_service (diff engine)  |
             | /api/messages    |     | message_service (SLA tracker) |
             | /api/dashboard   |     | dashboard_service (single agg)|
             | /api/events      |     | overdue_clause(now) (shared)  |
             | /api/agents      |     +-------------------------------+
             +------------------+                      |
                      |                                |
                      +--------------------------------+
                                       |
                                       v
                    +--------------------------------------------+
                    |             SQLAlchemy 2.0 ORM             |
                    |         (PostgreSQL 16 / SQLite)           |
                    +--------------------------------------------+
                                       |
                   +-------------------+-------------------+
                   |                                       |
                   v                                       v
         +-------------------+                   +-------------------+
         |   Docker Engine   |                   |  GitHub Actions   |
         |  (PostgreSQL 16   |                   |  CI Pipeline      |
         |   Named Volume)   |                   |  (Postgres & Node)|
         +-------------------+                   +-------------------+
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | Next.js 16.4.3 (App Router) | React Server Components, Partial Prerendering, optimized builds |
| **UI Library & Language** | React 19, TypeScript 5 | Strict typing, robust component lifecycle |
| **Styling** | Tailwind CSS v4, Lucide Icons | Polite Chaos dark theme, typography tokens, status indicators |
| **Client State & Cache** | TanStack React Query v5 | Server-state caching, automatic cache invalidation |
| **Form Management** | React Hook Form + Zod | Schema-validated forms with inline error mapping |
| **Notifications** | Sonner | Non-intrusive toast alerts for auto-saves and mutations |
| **Backend Framework** | FastAPI 0.162.0 | Async REST API, automatic OpenAPI / Swagger documentation |
| **Authentication & Security** | PyJWT, Bcrypt | Token-based authentication, password hashing, httpOnly cookies, role-based authorization |
| **Data Validation** | Pydantic v2 | Request/response schemas, field validations, error structures |
| **ORM & Migrations** | SQLAlchemy 2.0, Alembic | Declarative data models, relational constraints, migrations |
| **Database** | PostgreSQL 16 (Docker) / SQLite | Relational storage with check constraints and cascade behavior |
| **Python Tooling** | Astral uv | High-speed dependency resolution, lockfile management |
| **Testing** | Pytest, Starlette TestClient | Integration and regression test suite |
| **CI / CD** | GitHub Actions | Automated lint, build, migration, and test workflow |

---

## Prerequisites

- **Docker and Docker Compose** (for running PostgreSQL 16)
- **Node.js 20 LTS** and **npm**
- **Python 3.12+** and **uv** (Install via: `curl -LsSf https://astral.sh/uv/install.sh | sh` or `pip install uv`)

---

## Quickstart Setup

### 1. Start PostgreSQL Service
```bash
docker compose up -d db
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
uv sync --locked
uv run alembic upgrade head
uv run python -m app.seed
uv run uvicorn app.main:app --reload --port 8000
```
*Fallback Note*: If Docker is unavailable, configure `DATABASE_URL=sqlite:///./supportdesk.db` in `backend/.env`. The application handles both PostgreSQL and SQLite transparently.

### 3. Frontend Setup
In a new terminal:
```bash
cd frontend
cp .env.example .env.local
npm ci
npm run dev
```

### 4. Application Endpoints
- Frontend UI: `http://localhost:3000`
- Frontend Login: `http://localhost:3000/login`
- Backend API Docs (Swagger): `http://localhost:8000/docs`
- API Health Check: `http://localhost:8000/api/health`

---

## Demo Credentials

The database is pre-seeded with accounts for both Administrator and Agent roles. All seeded accounts share the same demo password:

- **Password**: `password123`

| User | Email | Role | Permissions |
|---|---|---|---|
| Admin User | `admin@example.com` / `admin@demo.local` | `admin` | Full system access, reassign any ticket regardless of current assignee |
| Agent User | `agent@example.com` / `agent@demo.local` | `agent` | Manage assigned/unassigned tickets; cannot reassign tickets owned by other agents |
| Sarah Chen | `sarah@example.com` | `admin` | Full administrative capabilities |
| Alex Rivera | `alex@example.com` | `agent` | Standard support agent capabilities |
| Maria Garcia | `maria@example.com` | `agent` | Standard support agent capabilities |
| James Wilson | `james@example.com` | `agent` | Standard support agent capabilities |

Instant 1-click login buttons are also provided directly on the `/login` page for fast role evaluation.

---



## Environment Variables

### Backend (`backend/.env`)

| Variable | Default Value | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql+psycopg://postgres:postgres@localhost:5432/supportdesk` | Database connection string |
| `CORS_ORIGINS` | `["http://localhost:3000","http://127.0.0.1:3000"]` | Allowed CORS origins (JSON array or comma-separated) |
| `JWT_SECRET` | `supportdesk-insecure-dev-secret-key-change-in-prod-32bytes` | Secret key used for signing JWT access tokens |
| `JWT_ALGORITHM` | `HS256` | JWT cryptographic algorithm |
| `JWT_EXPIRY_MINUTES` | `1440` | Token expiration lifetime in minutes (default: 24 hours) |
| `SLA_HOURS` | `4` | Target first public response SLA threshold in hours |
| `OVERDUE_HOURS` | `24` | Overall ticket overdue SLA threshold in hours |
| `APP_ENV` | `development` | Application runtime environment |

### Frontend (`frontend/.env.local`)

| Variable | Default Value | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Base backend server URL |

---

## Database Schema and Relationships

The database consists of four core relational models configured with constraints:

```
+------------------------------------+
|               agents               |
+------------------------------------+
| id          : INTEGER (PK)         |
| name        : VARCHAR(100)         |
| email       : VARCHAR(255) (UNIQUE)|
| role        : ENUM (admin, agent)  |
+------------------------------------+
         |                 |
         | 1:N (assignee)  | 1:N (author / actor)
         v                 v
+------------------------------------+
|              tickets               |
+------------------------------------+
| id          : INTEGER (PK)         |
| subject     : VARCHAR(200)         |
| customer_name  : VARCHAR(120)      |
| customer_email : VARCHAR(255)      |
| description : TEXT                 |
| status      : ENUM (open, in_progress, waiting_on_customer, resolved) |
| priority    : ENUM (low, medium, high, urgent)                         |
| assignee_id : INTEGER (FK -> agents.id, ON DELETE SET NULL)            |
| created_at  : TIMESTAMP WITH TIME ZONE                                 |
| updated_at  : TIMESTAMP WITH TIME ZONE                                 |
| resolved_at : TIMESTAMP WITH TIME ZONE (NULLABLE)                      |
+------------------------------------+
  Constraints:
  - CHECK: customer_name IS NOT NULL OR customer_email IS NOT NULL
  - CHECK: length(trim(subject)) > 0
         |
         | 1:N (ON DELETE CASCADE)
         +-------------------------------------+
         |                                     |
         v                                     v
+---------------------------------+   +---------------------------------+
|         ticket_messages         |   |          ticket_events          |
+---------------------------------+   +---------------------------------+
| id          : INTEGER (PK)      |   | id          : INTEGER (PK)      |
| ticket_id   : INTEGER (FK)      |   | ticket_id   : INTEGER (FK)      |
| kind        : ENUM (reply, note)|   | event_type  : ENUM (created,    |
| body        : TEXT              |   |   status_changed, priority_     |
| author_id   : INTEGER (FK NULL) |   |   changed, assignee_changed,    |
| author_name : VARCHAR(100)      |   |   reply_added, note_added)      |
| created_at  : TIMESTAMPTZ       |   | actor_id    : INTEGER (FK NULL) |
+---------------------------------+   | actor_name  : VARCHAR(100)      |
                                      | old_value   : TEXT              |
                                      | new_value   : TEXT              |
                                      | details     : JSON              |
                                      | created_at  : TIMESTAMPTZ       |
                                      +---------------------------------+
```

### Table Details
1. **`agents`**: Stores support agents and administrators.
2. **`tickets`**: Core ticket entities. Enforces customer presence and subject validity through database check constraints.
3. **`ticket_messages`**: Single table for both public customer replies (`public_reply`) and private notes (`internal_note`). Snapshots `author_name` at write time to maintain historical accuracy regardless of agent modification or deletion.
4. **`ticket_events`**: Immutable audit log of all ticket activity. Automatically captures state transitions with previous and new values.

---

## Backend Architecture

### Design Principles
- **Clean Separation of Concerns**: Routers handle HTTP protocol details (query parsing, status codes, response wrapping), while services contain all business rules and database mutations.
- **Uniform Error Envelope**: All API errors adhere to the standard `{ "error": { "code": string, "message": string, "details": [] } }` schema.
- **Single-Transaction Diffing Engine**: In `ticket_service.update_ticket()`, incoming patch fields are compared against current database values. Events are logged only for actual changes. Identical patch submissions produce no events and leave `updated_at` unchanged.
- **Shared SLA Overdue Clause**: The function `overdue_clause(now)` is shared across list filtering (`?overdue=true`), individual ticket retrieval (`is_overdue`), and aggregate dashboard counters, eliminating business logic divergence.
- **Wildcard Search Escaping**: Search inputs safely escape `%`, `_`, and `\` before passing parameters to SQL `ILIKE`, preventing wildcard injection.

---

## Frontend Architecture and Design System

### Design Philosophy: Polite Chaos
The UI implements the Polite Chaos design aesthetic:
- **Palette**: Dark foundation (`#1a1614`), elevated surface cards (`#201a18` / `#251f1c`), cream text (`#e3e3db`), warm muted labels (`#8c7e77`), and vibrant orange accents (`#ff6e14`).
- **Typography Hierarchy**:
  - Headings / Numbers: `Big Shoulders Display` (uppercase, tight tracking, extra-bold weight)
  - Data / Status / Metadata: `JetBrains Mono`
  - Body Copy: `Inter`
- **Visual Safety Indicators**:
  - Overdue rows and cards feature an orange alert indicator.
  - Internal notes feature a dark textured container with an amber/orange warning border, lock icon, and private disclaimer.
  - Composer tab changes switch button copy and styling between "Send Reply" and "Add Internal Note".

### Component Structure
- `Sidebar.tsx`: Persistent navigation linking to Dashboard, Ticket Queue, and New Ticket creation.
- `Header.tsx` & `AgentPicker.tsx`: Header banner with an "Acting as" selector stored in `localStorage` and shared via `ActingAgentContext`.
- `TicketTable.tsx`: Full queue table featuring status badges, priority pills, assignee markers, relative timestamps, and overdue row highlighting.
- `TicketFilters.tsx`: Debounced search (300ms), multi-select status and priority toggles, assignee selector, and overdue-only switch. All filter values synchronize to URL query parameters.
- `PropertiesPanel.tsx`: Ticket metadata sidebar with auto-saving select controls that submit `PATCH` requests on change.
- `Composer.tsx`: Dual-mode rich composer for public replies and internal notes.
- `ActivityTimeline.tsx`: Chronological timeline aggregating creation events, property adjustments, and messages.

---

## Business Rules and Invariants

1. **Overdue Calculation**: A ticket is overdue if and only if `status != 'resolved'` and `created_at < now - 24 hours`. Evaluated at query runtime without background cron jobs.
2. **Reopening Overdue Tickets**: Because overdue status is measured from `created_at`, reopening a resolved ticket whose creation date exceeds 24 hours immediately marks it overdue.
3. **Resolution Lifecycle**: Setting status to `resolved` sets `resolved_at = now()`. Transitioning out of resolved status clears `resolved_at` to `null`.
4. **Urgent Counter Exclusions**: Dashboard counters count only unresolved tickets for the urgent metric. A resolved urgent ticket requires no operational attention.
5. **Activity Bumping**: Any message (reply or note) immediately updates the ticket's `updated_at` timestamp.

---

## Continuous Integration (GitHub Actions)

The workflow defined in `.github/workflows/ci.yml` runs on all pushes and pull requests to `main`:

### Backend Job
1. Provisions Ubuntu runner with a `postgres:16` service container.
2. Sets up Python 3.12 with `astral-sh/setup-uv@v5` dependency caching.
3. Synchronizes packages strictly from lockfile: `uv sync --locked`.
4. Executes database migrations: `uv run alembic upgrade head`.
5. Runs test suite: `uv run pytest`.

### Frontend Job
1. Provisions Ubuntu runner with Node.js 20.
2. Runs clean installation with dependency caching: `npm ci`.
3. Runs linter: `npm run lint --if-present`.
4. Generates production build: `npm run build`.

---

## Automated Testing

The backend includes a comprehensive suite of 63 automated tests covering business logic, API validation, search behavior, history logging, and all four stretch goal features.

```bash
cd backend
uv run pytest
```

### Test Suite Structure
- `tests/test_dashboard.py`:
  - Zero-state metric verification
  - Count matching against seeded data
  - Counter reactivity to status changes and resolutions
- `tests/test_rules.py`:
  - Exact 24-hour SLA boundary tests (23h59m vs 24h01m)
  - Exclusion of resolved tickets from overdue
  - Reopened ticket overdue recalculations
  - Foreign key cascade deletions on ticket removal
- `tests/test_tickets.py`:
  - Validation errors (missing fields, blank strings, invalid emails, unknown enums)
  - Single-transaction diff logging for updates
  - No-op patch idempotency (zero events recorded)
  - Public reply and internal note ordering
  - Case-insensitive search and literal `%` escaping
  - Multi-status and multi-priority filter intersections
  - Non-overlapping pagination
- `tests/test_stretch_goals.py`:
  - Deterministic sort tie-breaker verification (`Ticket.id.desc()`)
  - Configurable first-response SLA targets (`SLA_HOURS`)
  - SLA breach detection for overdue unresponded tickets
  - Clock stop on first public reply (notes do not stop the clock)
  - Optimistic locking version incrementing and `HTTP 409 Conflict` on version mismatch
  - JWT login credential validation and token generation
  - HTTP-only cookie setting and token invalidation on logout
  - `GET /api/auth/me` identity verification
  - `HTTP 401 Unauthorized` enforcement on protected endpoints
  - `HTTP 403 Forbidden` enforcement when agents reassign another agent's ticket
  - Administrator privilege bypass allowing arbitrary reassignment

All 63 tests pass cleanly.

---

## Deliberate Product and Technical Decisions

1. **Read-Time SLA Calculation**: Rather than relying on background polling jobs or periodic database updates, both ticket overdue and first-response SLA states are calculated dynamically using SQL comparisons. This guarantees zero lag and prevents stale SLA states.
2. **JWT Authentication with Cookie and Bearer Support**: Requests authenticate via either `Authorization: Bearer <token>` or the secure `supportdesk_token` cookie, enabling flexible client and SSR integration.
3. **Role-Based Reassignment Invariants**: To prevent agent conflict, regular agents cannot reassign tickets owned by others. Administrators maintain override authority.
4. **Optimistic Locking via Integer Versions**: Protects concurrent editing workflows in multi-agent environments without requiring distributed row locking.
5. **Optimized Aggregate Queries**: Dashboard statistics are computed in a single SQL query using conditional `CASE` aggregations rather than seven sequential count queries.
6. **URL as Single Source of Truth**: Search, status, priority, assignee, sort, page, and overdue toggles are mirrored in URL search parameters, enabling bookmarking, browser back/forward navigation, and shareable links.

---

## Production Enhancements & Roadmap

1. **Search Scaling**: Transition from SQL `ILIKE` pattern matching to PostgreSQL Full-Text Search (`tsvector` / `tsquery`) with GIN indexing for million-row datasets.
2. **Real-Time Live Updates**: Introduce WebSocket or Server-Sent Events (SSE) connections to push live ticket queue and chat events directly to connected agent browsers.
3. **Email Ingestion**: Integrate SendGrid or AWS SES webhooks to convert inbound customer emails directly into support tickets.

---

## Walkthrough Guide

1. **Review Dashboard**: Navigate to `/` to inspect aggregate counters. Clicking any card navigates to `/tickets` with appropriate filters pre-applied.
2. **Filter and Search Queue**: Navigate to `/tickets`. Test search debouncing, multi-select status pills, and the overdue toggle. Observe the URL updating dynamically.
3. **Create a Ticket**: Navigate to `/tickets/new`. Submit empty inputs to observe client and server validation feedback. Complete the form to create a ticket and get redirected to its detail view.
4. **Update Properties**: In the ticket detail view, change Status, Priority, or Assignee in the properties panel. Observe the saving indicator, successful toast notification, and immediate update in the Activity Timeline.
5. **Add Messages**: Switch between "Public Reply" and "Internal Note" in the composer. Note the visual styling switch. Add a message and observe the timeline update along with the ticket's `updated_at` timestamp.
6. **Run Verification**: Execute `uv run pytest` in `backend/` and `npm run build` in `frontend/` to confirm complete system integrity.
