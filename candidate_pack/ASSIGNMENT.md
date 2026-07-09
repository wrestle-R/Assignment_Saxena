# Intern Hiring Test — Mini Exception Inbox

**Deadline:** 4 days from receipt.

---

## Context

Factory data is messy. Turning it into decisions is the job. Instead of dashboards that show planners 500 alerts a day, the system we're building reasons across disruptions and writes the response back into the ERP. That means every piece of code — from data pipelines to API endpoints to the UI a planner clicks through — has to handle real-world messiness.

This test is a miniature of that exact work. You're given two CSV files derived from real (Kaggle) store-item demand data, reframed as a manufacturing scenario: a production plan (what we said we'd make) and actual production (what we actually made). The gap between them — exceptions — is what needs to surface in an inbox someone acts on.

---

## The Task

Build a **Mini Exception Inbox**: ingest the two CSVs, detect plan-vs-actual deficit exceptions, serve them through an API, and render them in a UI where an operator can act on each one.

### 1. Ingest

Load both CSVs into a relational database. Keep raw data and cleaned data separable (separate raw vs clean tables, or an equivalent pattern).

- `actual_production.csv` — daily units actually produced
- `production_plan.csv` — daily planned production (note: column names differ from actuals — you'll need to map them)

### 2. Detect Exceptions

A **deficit exception** exists for a given product on a given day when:

```
units_produced < 0.9 × planned_units
```

Severity:
- **high** if `units_produced < 0.7 × planned_units`
- **medium** otherwise

Exceptions **must be materialized as rows in a database table**, not computed on the fly in the frontend. Each exception row should track its status (`open`, `acknowledged`, `resolved`).

### 3. API

Build a REST API (any backend language — FastAPI/Python scores familiarity points). It must support:

- `GET /exceptions` — list all exceptions, filterable by `product_code` and `severity`, **sorted by date descending** (newest exceptions first). Within the same day, sort worst deficit first.
- `GET /exceptions/{id}` — detail view including planned, actual, deficit percentage, and the product's last-7-days plan-vs-actual trend
- `PATCH /exceptions/{id}` — set status to `acknowledged` or `resolved`; must persist

### 4. Frontend

Build an **inbox** UI (React preferred, any framework accepted). The inbox should feel like a **day-by-day timeline** — exceptions grouped by date so a planner can see what came in each day:

- Exceptions listed by day (newest day first); within each day, worst deficit first
- Each day is a collapsible group showing that day's exceptions
- Severity badges + filters (by product, by severity) that work across the timeline
- Click an exception → detail panel showing the numbers and a 7-day trend (a table or a basic chart, either is fine)
- A button to acknowledge/resolve that updates the UI without a full page reload
- Not judged on visual polish — a working interface beats a beautiful one every time

---

## Submission & Deliverables

Submit **two files**:

1. **Code archive** — GitHub link or zip. One command to run everything in `README.md`; `docker-compose up` is a bonus.
2. **Presentation** (5–10 min max) — PPT, video, HTML page, or any format you're comfortable with, covering:
   - Demo of the app working end-to-end
   - Walkthrough of your database schema and key decisions
   - Explanation of your process: what you did, what you found in the data, tradeoffs you made
   - Anything you'd do differently
   - *Pick whatever format lets you explain best — clarity is what matters.*

This folder also has a copy of all instructions in HTML (`INSTRUCTIONS.html`).

Supporting documents to include **inside the code archive**:
- **`APPROACH.md`** — use the provided template (`templates/APPROACH_TEMPLATE.md`), max ~1 page. Include a **process flow diagram** showing your pipeline from data to UI (Excalidraw, Draw.io, Mermaid, or even a whiteboard sketch).
- **`AI_USAGE.md`** — use the provided template (`templates/AI_USAGE_TEMPLATE.md`). **This is mandatory and graded.** Tools used; your 3–5 most important prompts **verbatim** with what came back; one case where the AI was wrong and how you caught it; rough % AI-generated vs hand-written.
- **`README.md`** — include your system architecture overview (use `templates/ARCHITECTURE_README_TEMPLATE.md` for guidance). An **architecture diagram** showing the system stack is expected.

---

## Scoring — What Matters

We evaluate submissions on five dimensions (in priority order):

1. **Data handling & database** — Did you inspect the data, handle its quirks, and design a sensible schema?
2. **Backend completeness** — Working API with correct exception counts, filtering, and status mutation.
3. **Frontend** — Inbox works end-to-end, detail view is correct, status updates without reload.
4. **AI usage quality** — Quality of prompts, evidence of verifying AI output, honest reporting.
5. **Communication** — Clear approach doc, architecture diagram, and presentation.

---

## Rules & Expectations

> Using AI (Claude Code, Cursor, ChatGPT, Copilot…) is **expected and encouraged**. We are evaluating how well you drive it, not whether you avoided it. Hiding AI use, or an empty AI_USAGE.md, is a rejection signal.
>
> **If you're looking for AI help:** [Open Code](https://opencode.ai) has free built-in LLMs (DeepSeek V4 Flash Free, Nemotron Ultra) that are enough to get the work done. If you already have a subscription to another tool, use whatever you're comfortable with.
>
>
> Look at the data before you load it.

---

## Data Attribution

Dataset derived from the [Store Item Demand Forecasting Challenge](https://www.kaggle.com/c/demand-forecasting-kernels-only) (Kaggle). Licensed under the competition rules.
