# Inventory + POS System — Local Setup

This is the working, filled-in version of your project: the Django backend
(models, serializers, views, URLs, JWT auth) that was missing before, wired
up to match the React frontend exactly as it already calls the API in
`frontend/src/api/*.js`.

`venv/`, `node_modules/`, `db.sqlite3`, and `.env` are **not** included —
you'll create/regenerate those locally. `backend/.env.example` shows what
`.env` needs; copy it.

---

## Phase 1 — Backend (Django)

```powershell
cd backend
python -m venv venv

# PowerShell execution policy blocked activation last time, so just call
# the venv's python directly instead of activating — this always works:
.\venv\Scripts\python.exe -m pip install -r requirements.txt

copy .env.example .env
```

Open `backend/.env` and set `DJANGO_SECRET_KEY` to something random (or
leave the placeholder for local dev — it's fine, just don't deploy with it).
Everything else in `.env.example` already has sane local defaults, and the
project uses **SQLite automatically** — no Postgres/Supabase needed yet.

```powershell
.\venv\Scripts\python.exe manage.py migrate
.\venv\Scripts\python.exe manage.py seed_demo_data
.\venv\Scripts\python.exe manage.py runserver
```

`seed_demo_data` creates 3 branches, 6 products with stock at the Downtown
branch, and an admin login:

```
username: admin
password: ChangeMe123!
```

Change that password before this ever goes near the internet.

Confirm it's alive: open http://127.0.0.1:8000/admin/ and log in with the
above. You should see Branches, Products, Stock, Sales, and Users.

---

## Phase 2 — Frontend (React + Vite)

Install Node.js 20 LTS first if you haven't (this was the next unfinished
step from your notes).

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. `vite.config.js` already proxies `/api` to
`http://127.0.0.1:8000`, so as long as the Django server from Phase 1 is
running, login and the rest of the app will talk to it with no extra config.

Log in with the same `admin` / `ChangeMe123!` from above.

**Note:** `Dashboard.jsx`, `ProductList.jsx`, and `POSCheckout.jsx` currently
render hardcoded placeholder arrays (`PLACEHOLDER_PRODUCTS`, `TREND`, etc.)
instead of calling `listProducts()` / `getSalesSummary()` / `createSale()`
from `src/api/`. That was already true before — the backend endpoints those
functions call now exist and work (tested below), so swapping the
placeholders for real `useEffect` + API calls is a small follow-up, not a
structural fix.

---

## What the backend now provides

| Endpoint | Matches |
|---|---|
| `POST /api/auth/login/` | `src/api/auth.js` → `login()` |
| `POST /api/auth/refresh/` | `src/api/client.js` refresh-on-401 |
| `GET/POST /api/inventory/products/` | `src/api/products.js` → `listProducts()` |
| `GET /api/inventory/?branch_id=` | `src/api/products.js` → `getInventory()` |
| `POST /api/inventory/restock/` | `src/api/products.js` → `restock()` |
| `POST /api/sales/` | `src/api/sales.js` → `createSale()` |
| `GET /api/sales/` | `src/api/sales.js` → `listSales()` |
| `GET /api/sales/reports/summary/` | `src/api/sales.js` → `getSalesSummary()` |
| `GET /api/sales/reports/top-products/` | `src/api/sales.js` → `getTopProducts()` |

All of the above were tested locally end-to-end before packaging this ZIP:
login issues real JWTs, checkout deducts stock and snapshots the sale price,
and the reporting endpoints return real aggregated numbers.

---

## What's still ahead (matches your original Phase 3–5 plan)

- Wire the three placeholder pages to real API calls (swap the mock arrays
  for the `useEffect` + `src/api/*` calls already stubbed in comments there)
- Full local click-through test: Login → Dashboard → Products → POS → Reports
- `git init`, `.gitignore` is already set up to exclude `venv/`,
  `node_modules/`, `db.sqlite3`, and `.env`
- Push to GitHub, then Render (Django) + Supabase (Postgres) + Vercel (React)
