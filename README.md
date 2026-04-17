# Retail Mini App

Telegram Mini App for retail operations with:

- `React + Vite` frontend
- `FastAPI` backend
- `Supabase Postgres`
- `Docker` runtime for backend and frontend

## Current Status

The app is now functionally connected end-to-end:

- Telegram authentication is validated on the backend
- sellers can start/end shifts, pause/resume, create sales, and save stock changes
- admins can view dashboard stats, network sales, staff activity, low stock, and manage stores/products/staff
- Supabase is the source of truth for stores, products, inventory, sales, shifts, and staff activity

## Auth Model

Authentication is designed to be reliable and server-validated:

1. Telegram opens the Mini App.
2. The frontend sends `initData` to the backend.
3. The backend validates the Telegram signature using `TELEGRAM_BOT_TOKEN`.
4. The backend extracts the real `telegram_id`.
5. The backend loads the local user from the database by `telegram_id`.
6. The backend applies the role from the database, never from the client.

This means:

- `telegram_id` is the external identity
- roles live only in our database
- the client never decides whether it is `admin` or `seller`
- the production frontend no longer exposes a local role picker fallback

## Backend Structure

```text
backend/
  app/
    api/
    config.py
    db/
    models/
    schemas/
    services/
    main.py
  alembic/
  alembic.ini
  Dockerfile
  pyproject.toml
```

## Environment

Copy `.env.example` to `.env` and fill in:

- `ENVIRONMENT`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_DB_URL`
- `TELEGRAM_BOT_TOKEN`
- `VITE_API_BASE_URL`

Important:

- the anon key is fine for the frontend
- the backend should use `SUPABASE_DB_URL`
- the backend Telegram auth requires the bot token
- for Supabase production connections, prefer the `Session Pooler` host
- if your DB password contains special characters, URL-encode it in `SUPABASE_DB_URL`

## Run Full Stack With Docker

```bash
cp .env.example .env
docker compose up --build
```

The stack will start:

- `api` container
- `web` container with built frontend static files

The backend container will:

- install dependencies
- run `alembic upgrade head`
- start `uvicorn`

Local endpoints:

- frontend container health: `http://localhost:8080/health`
- backend health: `http://localhost:8000/api/v1/health`

## Frontend Production API

The frontend reads the backend base URL from `VITE_API_BASE_URL`.

For single-domain production behind `Nginx`, keep it as:

- `/api`

This lets the browser call the same origin for both the UI and API.

## Realtime Strategy

The app currently uses lightweight near-realtime polling for the most important screens:

- seller sales + current shift
- admin sales feed
- admin staff list
- admin dashboard summary

This keeps the interface fresh without requiring a dedicated websocket layer yet.

## Production Notes

Before public deployment:

1. Set `ENVIRONMENT=production`
2. Use the real `TELEGRAM_BOT_TOKEN`
3. Use the Supabase `Session Pooler` connection string
4. Set `VITE_API_BASE_URL=/api`
5. Point `nordanalytica.com` to the server
6. Configure host `Nginx` to proxy:
   - `/` to `127.0.0.1:8080`
   - `/api` to `127.0.0.1:8000/api/v1`
7. Launch the frontend only inside Telegram Mini App context

## Core Database Entities

Planned tables:

- `users`
- `user_store_assignments`
- `stores`
- `products`
- `inventory_balances`
- `sales`
- `sale_items`
- `shifts`
- `shift_breaks`
- `activity_events`

## Seed Data

Seed logic lives in:

- [backend/app/db/seed.py](./backend/app/db/seed.py)
- [backend/scripts/seed_db.py](./backend/scripts/seed_db.py)

To seed manually:

```bash
cd backend
python scripts/seed_db.py
```
