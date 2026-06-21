---
name: silverwall-legacy-backend
description: "Legacy FastAPI backend and migration guidelines: FastAPI routing, Supabase schema connections, and how APIs translate to the TS + SpacetimeDB engine."
---

# SilverWall Legacy Backend Guide

## 1. Role & Tech Stack
- Main API directory: `backend/`.
- Built on **FastAPI (Python)**.
- Handled historical results, countdowns, driver profiles, World Champions, and team radio commentaries via a mix of FastAPI routes, Supabase PostgreSQL, and Google Gemini.

## 2. Directory Layout
- `backend/main.py`: Entry point configuring CORS and registering routers.
- `backend/routes/`: Sub-routers for endpoints (e.g. `status.py`, `standings.py`, `discord.py`, `results.py`, `track.py`).
- `backend/migrations/`: SQL migration files (`001_create_tables.sql`, etc.) seeding historical archives into Supabase.
- `backend/pipeline/`: Automated pipelines (e.g. `health_keepalive.py`, `seed_tracks.py`).

## 3. Migration to SpacetimeDB
- The Python/Supabase setup is legacy and has been transitioned to SpacetimeDB.
- To ensure operational continuity, compare REST behaviors in `backend/routes/` with corresponding TypeScript reducers in `spacetimedb/src/index.ts`.
- Run legacy backend locally for verification:
  ```powershell
  cd backend
  python -m venv venv
  .\venv\Scripts\activate
  pip install -r requirements.txt
  python -m uvicorn main:app --reload --port 8000
  ```
