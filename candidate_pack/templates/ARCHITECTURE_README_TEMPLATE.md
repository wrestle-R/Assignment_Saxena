# Architecture — Mini Exception Inbox

> *Replace this with your own architecture overview.*

## System Overview

*Brief description of the overall system — what it does, how the pieces fit together. 2–3 sentences.*

## Architecture Diagram

*Include a diagram showing the pipeline: CSV → Database → API → Frontend. This can be an image (exported from Excalidraw, Draw.io, Figma, etc.) or an ASCII/ Mermaid diagram.*

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  CSVs    │ →  │  Ingest  │ →  │  API     │ →  │  Frontend│
│ (raw)    │    │ + Clean  │    │ (FastAPI)│    │ (React)  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                      │
                      ↓
                ┌──────────┐
                │ Database │
                │ (SQLite) │
                └──────────┘
```

## Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Database | *e.g. SQLite* | *Zero setup, good enough for this scope* |
| Backend | *e.g. FastAPI* | *Python, automatic OpenAPI docs* |
| Frontend | *e.g. React + Vite* | *Fast dev loop, component model* |
| *Other* | *e.g. Docker* | *Reproducible environment* |

## Database Schema

*Describe your tables and relationships. Include a quick ER diagram if helpful.*

```
raw_plan        → raw_actual
    ↓                ↓
    └──→ clean_plan ←──┘
              ↓
       exceptions (id, product_code, date, planned, actual, deficit_pct, severity, status)
```

## Project Structure

```
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── database.py
│   └── seed.py
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   └── ...
│   └── package.json
├── data/
│   ├── actual_production.csv
│   └── production_plan.csv
├── docker-compose.yml
└── README.md
```

## Key Decisions

- *Why SQLite over Postgres?*
- *Why this frontend framework?*
- *How did you handle the data cleaning?*
- *What would you change with more time?*

## Running the Project

*One-command instructions to get everything running. Include `docker-compose up` if applicable.*
