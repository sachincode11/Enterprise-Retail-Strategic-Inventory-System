# ============================================================
# ERSIS Backend – Multi-Stage Dockerfile
# Runtime: Python 3.13-slim  |  Package manager: uv
# ============================================================

# ──────────────────────────────────────────────
# Stage 1 – dependency installer (builder layer)
# ──────────────────────────────────────────────
FROM python:3.13-slim AS builder

# Install uv (ultra-fast pip replacement used by this project)
RUN pip install --no-cache-dir uv

WORKDIR /app

# Copy only the dependency manifest files first.
# Docker caches this layer, so changing source code won't
# re-download packages unless pyproject.toml / uv.lock change.
COPY pyproject.toml uv.lock ./

# Install all production dependencies into /app/.venv
# --no-dev skips devDependencies, --frozen uses the exact lock file
RUN uv sync --frozen --no-dev

# ──────────────────────────────────────────────
# Stage 2 – final slim runtime image
# ──────────────────────────────────────────────
FROM python:3.13-slim AS final

# Security: run as a non-root user
RUN groupadd --system ersis && useradd --system --gid ersis ersis

WORKDIR /app

# Copy the pre-built virtual environment from the builder stage.
# This keeps the final image free of build tools (uv, gcc, etc.).
COPY --from=builder /app/.venv /app/.venv

# Copy the entire application source
COPY . .

# Ensure the faiss_indexes directory exists so FAISS can write to it
RUN mkdir -p /app/faiss_indexes

# Correct ownership for the non-root user
RUN chown -R ersis:ersis /app

USER ersis

# Tell Python to use the venv we copied from the builder stage
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Port the FastAPI/uvicorn server listens on
EXPOSE 8000

# Health check: FastAPI exposes /health out of the box (defined in main.py)
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

# Default: production mode (no --reload).
# docker-compose.dev.yml overrides this CMD with --reload for development.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
