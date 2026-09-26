"""CareerScope AI FastAPI application factory."""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError

from app.api.middleware import SecurityMiddleware
from app.api.router import api_router
from app.core.config import settings, BACKEND_DIR
from app.core.logging import get_logger, setup_logging
from app.db.session import engine, init_db

setup_logging()
logger = get_logger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting %s (env=%s)", settings.APP_NAME, settings.ENV)
    try:
        init_db()
        logger.info("Database ready (AUTO_CREATE_TABLES=%s)", settings.AUTO_CREATE_TABLES)
    except Exception:  # noqa: BLE001
        logger.exception("Database initialization failed. Check DATABASE_URL / PostgreSQL.")
    yield
    engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Agentic Live Job-Market Intelligence & Career Planning platform",
    lifespan=lifespan,
)

app.add_middleware(SecurityMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.get("/health", tags=["system"])
def health() -> dict:
    return {"status": "ok", "app": settings.APP_NAME}


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    first = exc.errors()[0]
    field = ".".join(str(x) for x in first.get("loc", []) if x not in ("body", "query"))
    return JSONResponse(
        status_code=422,
        content={"detail": f"{field or 'input'}: {first.get('msg', 'invalid value')}"},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Something went wrong on our side. Please try again."},
    )


STATIC_DIR = BACKEND_DIR / "static"

if STATIC_DIR.is_dir():
    assets_dir = STATIC_DIR / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        root = STATIC_DIR.resolve()
        candidate = (STATIC_DIR / full_path).resolve()
        if full_path and candidate.is_file() and str(candidate).startswith(str(root)):
            return FileResponse(candidate)
        index = root / "index.html"
        if index.is_file():
            return FileResponse(index)
        return JSONResponse(status_code=404, content={"detail": "Not found"})