# SIH2026-122

## Project Solution

SIH2026-122 is an automated progress-report matching system for construction and industrial projects. It converts free-text field or Daily Progress Reports into structured schedule updates, while routing uncertain matches to human review instead of making unsafe changes.

The solution combines a Python processing engine, a FastAPI backend, and a React dashboard. Planned schedule data remains separate from actual execution data so automatic updates do not overwrite the baseline plan.

## Features

- Submit individual reports, batch reports, or uploaded report files.
- Normalize field terminology, abbreviations, typos, and equipment identifiers.
- Extract equipment, location, activity, event, date, and progress information.
- Retrieve and rank likely schedule activities using metadata and semantic signals.
- Produce explainable decisions: `AUTO_MATCH`, `HUMAN_REVIEW`, or `UNMATCHED`.
- Update actual activity status and progress only for approved automatic matches.
- Review, confirm, reject, or resolve low-confidence report matches.
- Track activity progress, pending reviews, recent updates, and analytics in the dashboard.
- Evaluate predictions against the supplied ground-truth dataset.

## Architecture

```text
React + TypeScript dashboard
      |
    FastAPI REST API
      |
    Integration pipeline
      |
  1 Normalize -> 2 Extract -> 3 Retrieve candidates
   -> 4 Rank -> 5 Decide -> 6 Update schedule
      |
   Data/schedule_master_v1.csv  (planned baseline)
   Data/execution_state.csv     (actual execution state)

Ground truth -> 7 Evaluation (offline only)
```

### Main components

- `Engine/`: normalization, extraction, candidate retrieval, matching, decision, schedule update, and evaluation modules.
- `integration/`: end-to-end pipeline orchestration, report segmentation, and command-line entry point.
- `shared/`: common Pydantic schemas, constants, exceptions, and data contracts.
- `backend/`: FastAPI endpoints for projects, activities, reports, reviews, updates, and analytics.
- `frontend/`: Vite-powered React and TypeScript dashboard.
- `Data/`: schedule, reports, execution state, domain context, and evaluation data.

## Run Locally

### Prerequisites

- Python 3.10 or newer
- Node.js 18 or newer
- npm

Run all commands from the repository root unless stated otherwise.

### Backend and pipeline

Create and activate a virtual environment, then install the Python dependencies:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

The project runs with the built-in TF-IDF semantic fallback by default. For embedding-based semantic matching, install the optional dependency separately:

```powershell
python -m pip install "sentence-transformers>=3.0,<6.0"
```

This package downloads the `all-MiniLM-L6-v2` model when the pipeline starts and may require additional disk space and startup time.

Run the pipeline against the included sample data:

```powershell
python -m integration --demo
```

Start the API:

```powershell
python -m uvicorn backend.main:app --host 0.0.0.0 --port 5000 --reload
```

The API is available at `http://localhost:5000`. Health status is available at `http://localhost:5000/health`.

### Frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite development server proxies `/api` requests to the backend on port `5000`.

### Tests

From the repository root:

```powershell
pytest
```
