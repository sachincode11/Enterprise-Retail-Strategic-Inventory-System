# ============================================================
# ERSIS Frontend (React + Vite) – Multi-Stage Dockerfile
# ============================================================

# ──────────────────────────────────────────────
# Stage 1 – builder: install deps & compile
# ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifest files first to leverage Docker layer cache.
# npm install only re-runs when package.json / package-lock.json change.
COPY package.json package-lock.json ./
RUN npm ci --silent

# Copy the rest of the source and build the static bundle
COPY . .

# Build-time env vars (Vite inlines them at compile time).
# These are injected via docker-compose as build args.
ARG VITE_API_BASE_URL=/api
ARG VITE_DEFAULT_STORE_ID=1
ARG VITE_USE_MOCK_PRODUCTS=false
ARG VITE_USE_MOCK_AUTH=false
ARG VITE_USE_MOCK_SUPPLIERS=false
ARG VITE_USE_MOCK_TRANSACTIONS=false
ARG VITE_USE_MOCK_ORDERS=false

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_DEFAULT_STORE_ID=$VITE_DEFAULT_STORE_ID \
    VITE_USE_MOCK_PRODUCTS=$VITE_USE_MOCK_PRODUCTS \
    VITE_USE_MOCK_AUTH=$VITE_USE_MOCK_AUTH \
    VITE_USE_MOCK_SUPPLIERS=$VITE_USE_MOCK_SUPPLIERS \
    VITE_USE_MOCK_TRANSACTIONS=$VITE_USE_MOCK_TRANSACTIONS \
    VITE_USE_MOCK_ORDERS=$VITE_USE_MOCK_ORDERS

RUN npm run build

# ──────────────────────────────────────────────
# Stage 2 – production: serve with Nginx
# ──────────────────────────────────────────────
FROM nginx:1.27-alpine AS final

# Remove default Nginx page
RUN rm -rf /usr/share/nginx/html/*

# Copy the compiled React app from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy our custom Nginx config that handles React Router (SPA) and
# reverse-proxies /api/* to the backend container
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
