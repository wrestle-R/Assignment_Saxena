# Approach

I started with a very small auth flow and built out from there. First came the backend seed path, then the API, then the dashboard shell, and only after that did I spend time on the UI polish. That kept me from styling something that still had data issues underneath it.

## Problem breakdown

My order was roughly:

1. Get login working with a cookie-based session.
2. Load the CSVs into raw collections so nothing was lost.
3. Normalize the rows into clean plan and actual collections.
4. Separate the bad records into `data_quality_issues`.
5. Generate exceptions only from matched clean rows.
6. Build the dashboard filters, detail panel, and status actions.
7. Clean up the layout so it felt quiet and readable instead of busy.

## Data decisions

The source data had a few real issues, and I handled them instead of pretending they were clean.

- `production_plan.csv` mixes ISO dates and `MM/DD/YYYY` dates. I normalized both to `YYYY-MM-DD`.
- `actual_production.csv` is already ISO-based, so that file was simpler to clean.
- Numeric fields come in as strings. I converted them to numbers so deficit math works correctly.
- There are blank `planned_units` values in the plan file. I kept those out of the clean plan table and turned them into data-quality issues instead.
- There are duplicate plan groups after normalization. I treated those as quarantine cases rather than forcing them into the clean path.
- There are unmatched plan rows and unmatched actual rows. Those are tracked as data-quality issues, not exceptions.
- I checked for leading or trailing whitespace in the main code fields and did not find an obvious issue in the source files I reviewed.

The counts from the actual CSVs were:

- `production_plan.csv`: 1,085 rows
- `actual_production.csv`: 1,080 rows
- plan dates: 1,045 ISO, 40 slash-format
- blank plan quantities: 2
- duplicate normalized plan groups: 14
- unmatched plan rows: 10
- unmatched actual rows: 19

## Schema & why

- `users` exists just for auth. It stays small and boring on purpose.
- `raw_plan_rows` and `raw_actual_rows` keep the original CSV payloads, which made it easier to debug bad rows later.
- `clean_plan_records` and `clean_actual_records` give me a normalized layer for matching and reporting.
- `exceptions` stores the business result of the matched rows: planned units, actual units, deficit percentage, severity, and status.
- `data_quality_issues` stores everything I did not want to mix into exception math. That includes duplicates, blanks, invalid dates, and unmatched rows.

That split made the backend easier to reason about. Raw data stays raw, clean data stays clean, and the dashboard only sees what it needs.

## API design notes

I kept the API shape simple on purpose.

- Authentication uses a JWT in an HTTP-only cookie.
- Filters are query params instead of a bunch of separate endpoints, so the dashboard can combine them cleanly.
- The exception and data-quality endpoints both support `open`, `acknowledged`, and `resolved`, so “unresolve” is just moving a record back to `open`.
- The detail endpoints return the full row context, not just the card summary. That made the side panel much easier to build.

## Tradeoffs

- I used shadcn and the existing token setup instead of building a custom design system from scratch.
- I used TanStack Query instead of direct Axios calls because the dashboard depends on cached filtering and mutation refreshes.
- I kept the first version narrow instead of trying to turn it into a full warehouse platform on day one.

## Next steps

If I had more time, I would turn this into a small operational tool instead of just a review screen.

- Add a proper data-entry flow for warehouse staff.
- Let users upload new CSVs from the UI.
- Add audit history for status changes.
- Add saved filters and exports.
- Add role-based access so reviewers and operators do not share the same experience.

