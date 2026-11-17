# Stundent's Personal Organization 

A personal organization app for students — currently in development, starting with the finance module. Most of the code writing has been handled by Claude AI following the project blueprint.

## What it does

- Tracks income and expenses, tagged by category and necessity level
- Fixed monthly budget with a daily spending target
- Daily and monthly spending overview, with alerts when a category runs over its historical average
- Full transaction history, filterable by month and category

Two more modules are planned: time management and study tracking, sharing the same backend and database.

## Stack

- **Backend:** FastAPI + SQLAlchemy (SQLite locally, PostgreSQL in production)
- **Frontend:** Progressive Web App (vanilla HTML/CSS/JS) — installable on Android, no build step
- **For the future:** migration to React Native for native iOS/Android distribution

## Project structure

```
main.py              FastAPI entry point, CORS, module routing
database.py           Shared DB connection across modules
finanza/               Finance module (models, logic, API routes)
tempo/                  Time management module (scaffolded, not yet built)
studio/                  Study tracking module (scaffolded, not yet built)
frontend/
  index.html             App shell
  css/, js/                Styles and client logic
```
