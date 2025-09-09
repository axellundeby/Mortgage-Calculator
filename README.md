# Mortgage-Calculator

A small full‑stack app for exploring and refinancing consumer loans. The backend is a FastAPI service persisting to SQLite and reading/writing CSV files. The frontend is a React (Create React App + TypeScript + Tailwind) single-page app.

## Tech Stack
- Backend: FastAPI, Uvicorn, SQLite, pandas, numpy‑financial
- Frontend: React (CRA), TypeScript, Tailwind CSS
- Deployment (recommended):
  - Backend → Render (Web Service)
  - Frontend → Vercel (project root set to `frontend`)

## Monorepo Structure
```
Backend/
  api.py               # FastAPI app (all routes under /api/...)
  database.py          # SQLite helpers and persistence
  users.py             # Loan/user helpers (calculations & transforms)
  loan_evaluator.py    # Loan computations, CSV calculations, simulations
  risky_Loans_writer.py# Fetches/normalizes Finansportalen feed to CSV
  init_db.py           # (If used) initialize DB schema
  flytta.db            # SQLite database file (created at runtime)
frontend/
  src/components/...   # React components & forms
  package.json         # CRA scripts and deps
```

## Prerequisites
- Node.js 18 or 20 LTS (for frontend)
- Python 3.11 (recommended for backend)

## Environment Variables
- Backend:
  - `FINANSPORTALEN_USERNAME` (optional, for fetching data from Finansportalen)
  - `FINANSPORTALEN_PASSWORD` (optional)
- Frontend:
  - `REACT_APP_API_BASE` (required) → Base URL of the backend, e.g. `https://your-backend.onrender.com`

## Local Development

### Backend (FastAPI)
```bash
cd Backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
# run (use python -m to avoid picking global uvicorn)
python -m uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```
- API available at `http://localhost:8000`
- Open Swagger at `http://localhost:8000/docs`

If you use Anaconda, ensure you run uvicorn via the venv’s Python:
```bash
/absolute/path/to/repo/Backend/.venv/bin/python -m uvicorn api:app --reload
```

### Frontend (React CRA)
```bash
cd frontend
# set env for local dev (create .env.local)
echo "REACT_APP_API_BASE=http://localhost:8000" > .env.local
npm ci  # or npm install
npm start
```
- App runs at `http://localhost:3000`

## API Overview (selected)
- `POST /api/register` → { username, password, age }
- `POST /api/login` → { username, password }
- `GET  /api/user-age/{username}`
- `GET  /api/user-loan/{username}`
- `POST /api/authorize` → { username, fullmakt }
- `POST /api/find-loan` → { username, age, amount, months }
- `POST /api/save-loan` → body: { username, loan }
- `POST /api/auto-refinance` → { username }
- `GET  /api/get-auto-refinansiering/{username}`
- `POST /api/set-auto-refinansiering` → { username, auto_refinansiering }
- `GET  /api/loan-history/{username}`
- `GET  /api/total-savings/{username}`
- `POST /api/clear-loan-history` → { username }
- `POST /api/simulate-loan` → { months }
- `POST /api/sim-current-loan/{username}` → { months }

Data files used:
- `Backend/forbrukslan_data_clean.csv` is the normalized CSV (can be created/updated via the Finansportalen feed).

## Fetching and Normalizing Finansportalen Feed (optional)
The script `Backend/risky_Loans_writer.py` pulls the Atom feed, parses it, and writes `forbrukslan_data_clean.csv`.
```bash
cd Backend
source .venv/bin/activate
export FINANSPORTALEN_USERNAME=...  # if required
export FINANSPORTALEN_PASSWORD=...  # if required
python risky_Loans_writer.py
```

## Deployment

### Backend on Render
- Create a new Web Service from your GitHub repo.
- Root Directory: `Backend`
- Build Command:
  ```
  pip install -r requirements.txt
  ```
- Start Command:
  ```
  uvicorn api:app --host 0.0.0.0 --port $PORT
  ```
- Set environment variables as needed (`FINANSPORTALEN_*`).
- Note: Disk is persistent on Render, so SQLite `flytta.db` will persist. Consider backups/hosted DB for production.

### Frontend on Vercel
- Create a new project from the repo.
- Set Root Directory to `frontend` (Project → Settings → General → Build & Development → Root Directory).
- Framework Preset: Create React App
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: `build`
- Add Environment Variable: `REACT_APP_API_BASE = https://<your-render-backend>`
- Deploy.

## Common Issues & Tips
- Uvicorn reloader starts a subprocess that may pick up a different Python than your venv (especially with Anaconda). Prefer:
  ```bash
  python -m uvicorn api:app --reload
  # or full path to venv python
  /path/to/.venv/bin/python -m uvicorn api:app --reload
  ```
- If Vercel build complains about `import.meta.env` (Vite), use CRA envs:
  ```ts
  const API_URL = process.env.REACT_APP_API_BASE || "";
  ```
- If Render health check on `/` returns 404, either add a simple root route in `api.py` or set Health Check Path to an existing endpoint (e.g. `/docs` or `/api/has-consent/test`).
- Pandas build failures on certain Python versions in CI: prefer Python 3.11 and prebuilt wheels (Render supports specifying `PYTHON_VERSION=3.11.x`).

## Scripts
- Backend dev: `python -m uvicorn api:app --reload`
- Frontend dev: `npm start`
- Frontend build: `npm run build`

