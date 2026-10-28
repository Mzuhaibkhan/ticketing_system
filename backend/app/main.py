from fastapi import FastAPI, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.core.errors import register_exception_handlers
from app.routers import agents, tickets, messages, events, dashboard


def create_app() -> FastAPI:
    app = FastAPI(
        title="Support Desk API",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc"
    )

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register uniform exception handlers
    register_exception_handlers(app)

    # Register API Routers
    app.include_router(agents.router)
    app.include_router(tickets.router)
    app.include_router(messages.router)
    app.include_router(events.router)
    app.include_router(dashboard.router)

    @app.get("/api/health", status_code=status.HTTP_200_OK, tags=["Health"])
    def health_check(db: Session = Depends(get_db)):
        try:
            db.execute(text("SELECT 1"))
            db_status = "connected"
        except Exception as e:
            db_status = f"unreachable: {str(e)}"
        
        return {
            "status": "ok",
            "database": db_status,
            "version": "1.0.0"
        }

    return app


app = create_app()
