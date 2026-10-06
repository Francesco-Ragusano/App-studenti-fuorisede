# App Studenti Fuori Sede

A personal organization app for students — currently in development, starting with the finance module.

**Status:** active development · personal use

## What it does

- Tracks income and expenses, tagged by category and necessity level
- Fixed monthly budget with a daily spending target
- Daily and monthly spending overview, with alerts when a category runs over its historical average
- Full transaction history, filterable by month and category

Two more modules are planned: time management and study tracking, sharing the same backend and database.

## Stack

- **Backend:** FastAPI + SQLAlchemy (SQLite locally, PostgreSQL in production)
- **Frontend:** Progressive Web App (vanilla HTML/CSS/JS) — installable on Android, no build step
- **Planned:** migration to React Native for native iOS/Android distribution

## Project structure

```
main.py              FastAPI entry point, CORS, module routing
database.py           Shared DB connection across modules
finanza/               Finance module (models, business logic, API routes)
tempo/                  Time management module (scaffolded, not yet built)
studio/                  Study tracking module (scaffolded, not yet built)
frontend/
  index.html             App shell
  css/, js/                Styles and client logic
```

## Running locally

```bash
# Backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend (separate terminal)
cd frontend
python3 -m http.server 5500
```

Backend: `http://localhost:8000` (interactive API docs at `/docs`)
Frontend: `http://localhost:5500`

## Roadmap

- [x] Finance module — tracking, budgeting, alerts, history
- [ ] Deploy (GitHub → Render, PostgreSQL)
- [ ] Time management module
- [ ] Study tracking module
- [ ] React Native migration
