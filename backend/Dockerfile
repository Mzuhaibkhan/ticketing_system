FROM python:3.12-slim

# Install uv package manager
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

# Copy dependency specifications
COPY pyproject.toml uv.lock ./

# Install project dependencies
RUN uv sync --frozen --no-dev --no-install-project

# Copy application code
COPY . .

# Run project install
RUN uv sync --frozen --no-dev

EXPOSE 8000

# Run migrations, seed demo data, and start ASGI server
CMD ["sh", "-c", "uv run alembic upgrade head && uv run python -m app.seed && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000"]

