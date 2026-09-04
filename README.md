# Sales Management System

A small end-to-end Sales Management System built for the Full Stack Engineer technical
assessment: a **Salesman web app**, a **FastAPI backend**, a **PostgreSQL database**, and a
**React Admin Dashboard**.

## Architecture decision: Salesman app is React (web), not Flutter

The brief allows "another suitable frontend technology" if Flutter isn't used. Given the
24–48 hour scope, I chose **React + Vite** for the Salesman app instead of Flutter so the
entire stack shares one language (JS/TS + Python), one deployment pattern (Docker + static
hosting), and one set of tooling — this maximizes the time available for correctness,
testing, and authorization logic rather than context-switching between ecosystems. If a
native mobile client is a hard requirement, the same FastAPI backend can be reused as-is;
only a new client would need to be built against the existing REST API.

---

## 1. Architecture

```
┌─────────────────────┐        ┌──────────────────────┐
│   Salesman Web App   │        │   Admin Dashboard     │
│   (React + Vite)      │        │   (React + Vite)       │
│   port 5174            │        │   port 5173              │
└──────────┬───────────┘        └───────────┬──────────┘
           │            REST + JWT (fetch)               │
           └───────────────────┬─────────────────────────┘
                                │
                     ┌──────────▼───────────┐
                     │   FastAPI Backend      │
                     │   port 8000               │
                     │   /api/auth, /api/users,  │
                     │   /api/customers,          │
                     │   /api/products,             │
                     │   /api/orders                  │
                     └──────────┬───────────┘
                                │ SQLAlchemy ORM
                     ┌──────────▼───────────┐
                     │   PostgreSQL 16          │
                     │   port 5432                │
                     └───────────────────────┘
```

### Frontend/backend communication
Both frontends are plain SPAs that call the backend's JSON REST API directly over `fetch`.
There is no server-side rendering or backend-for-frontend layer — this keeps the system
easy to reason about for the assessment's scope. Each frontend stores its JWT in
`localStorage` and attaches it as `Authorization: Bearer <token>` on every request. A `401`
response clears the stored token and redirects to `/login`.

### Database structure
Five tables: `users` (salesmen/admins), `customers`, `products`, `orders`, `order_items`.

- `orders.customer_id` → `customers.id`, `orders.salesman_id` → `users.id`
- `order_items.order_id` → `orders.id` (cascade delete), `order_items.product_id` → `products.id`
- `order_items` snapshots `unit_price` at the time of the order, so historical orders stay
  accurate even if a product's price changes later.
- Constraints: non-negative prices/stock/totals, positive quantities, unique SKU, unique
  `(order_id, product_id)` pair, indexes on frequently-filtered columns
  (`username`, `sku`, `name`, `created_at`, `salesman_id + created_at`).

See [`backend/app/models.py`](backend/app/models.py) and the migration
[`backend/alembic/versions/0001_initial_schema.py`](backend/alembic/versions/0001_initial_schema.py)
for the full schema.

### Authentication & authorization flow
1. `POST /api/auth/login` accepts `username`/`password` (OAuth2 password flow), verifies the
   bcrypt hash, and returns a signed JWT (`HS256`) containing the user id and role.
2. Every protected endpoint depends on `get_current_user`, which decodes the JWT and loads
   the user from the DB (rejecting inactive/deleted accounts).
3. Role-based authorization is enforced with a `require_role(...)` dependency:
   - **Salesmen** can browse customers/products, create orders, and view **only their own**
     order history — even if they guess another order's ID (`403`, not silent filtering).
   - **Admins** can manage products/customers/users, view **all** orders, change order
     status, and access analytics endpoints. Salesmen get a `403` on all of these.
4. Order totals and stock deduction are always computed **server-side** from the current
   product price — the client only ever sends `product_id` + `quantity`, so a tampered
   client can't submit a fake price.

---

## 2. Local Setup

### Prerequisites
- Docker + Docker Compose (recommended — spins up all 4 services with one command), **or**
- Python 3.11+, Node.js 20+, and a local PostgreSQL 16 instance if running services individually.

### Option A — Docker Compose (recommended)

```bash
git clone <your-repo-url>
cd sales-management-system
docker compose up --build
```

This starts, in order: PostgreSQL → backend (runs Alembic migrations, seeds demo data,
then starts Uvicorn) → both frontends (built and served via nginx).

| Service          | URL                         |
|------------------|------------------------------|
| Backend API      | http://localhost:8000        |
| API docs (Swagger)| http://localhost:8000/docs  |
| Admin Dashboard  | http://localhost:5173        |
| Salesman App     | http://localhost:5174        |
| PostgreSQL       | localhost:5432                |

To stop: `docker compose down` (add `-v` to also delete the database volume).

### Option B — Run each service individually

**1. PostgreSQL**
```bash
docker run -d --name sales_db -p 5432:5432 \
  -e POSTGRES_USER=sales_user -e POSTGRES_PASSWORD=sales_pass -e POSTGRES_DB=sales_db \
  postgres:16-alpine
```

**2. Backend**
```bash
cd backend
cp .env.example .env          # edit if your DB creds differ
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head           # create schema
python -m app.seed             # seed demo data + test credentials
uvicorn app.main:app --reload --port 8000
```
API docs: http://localhost:8000/docs

**3. Admin Dashboard**
```bash
cd admin-dashboard
cp .env.example .env           # VITE_API_BASE_URL=http://localhost:8000
npm install
npm run dev                    # http://localhost:5173
```

**4. Salesman App**
```bash
cd salesman-app
cp .env.example .env           # VITE_API_BASE_URL=http://localhost:8000
npm install
npm run dev                    # http://localhost:5174
```

### Test credentials (seeded automatically)

| Role     | Username    | Password    |
|----------|-------------|-------------|
| Admin    | `admin`     | `Admin@123` |
| Salesman | `salesman1` | `Sales@123` |

---

## 3. Deployment

This repo is deployment-target-agnostic — `docker-compose.yml` works as-is on any VM
(e.g. a DigitalOcean/EC2 droplet) or can be adapted to managed services:

- **Backend**: any container host (Render, Railway, Fly.io, ECS) — set the environment
  variables from `backend/.env.example` (especially `DATABASE_URL`, `SECRET_KEY`,
  `CORS_ORIGINS`), then run `alembic upgrade head` before starting Uvicorn.
- **PostgreSQL**: a managed instance (Render/Railway/RDS/Neon/Supabase) is recommended over
  the bundled container for anything beyond a demo.
- **Frontends**: each builds to static files (`npm run build` → `dist/`) and can be hosted
  on Vercel/Netlify/Cloudflare Pages, or served via the included nginx Dockerfile. Set
  `VITE_API_BASE_URL` to the deployed backend's public URL at build time.

   **Live deployment:**
   - Backend URL: https://sales-management-backend-t949.onrender.com (API docs: https://sales-management-backend-t949.onrender.com/docs)
   - Admin Dashboard URL: https://salesmanagement-system.vercel.app
   - Salesman App URL: https://salesmanagement-system-bwed.vercel.app
   - GitHub repo: https://github.com/Alfrin05062005/Salesmanagement-system

   **Note:** the backend runs on Render's free tier, which spins down after periods of
   inactivity. The first request after idle time may take 30-60 seconds to respond while it
   wakes back up — this is expected behavior, not an error.
---

## 4. Testing

```bash
cd backend
pip install -r requirements.txt
pytest -v
```

Tests use an in-memory SQLite database (via dependency override on `get_db`) so they run
fast and require no external services — production itself runs on PostgreSQL.

**Coverage:**
- `tests/test_auth.py` — login success/failure, protected-route access, invalid/missing tokens.
- `tests/test_orders.py` — order total calculation (single item, multiple items), stock
  validation/deduction, rejecting unknown customers, rejecting empty/invalid item lists,
  order history scoping.
- `tests/test_authorization.py` — salesman blocked from another salesman's order, salesman
  blocked from admin-only endpoints (analytics, product creation, user list), admin can
  access everything and see all orders.
- `tests/test_validation.py` — malformed login, negative price, duplicate SKU, 404s for
  missing resources, invalid email format.

---

## 5. What's simplified for the assessment's timeframe

Per the brief's guidance ("prioritize working → correct → tested → secure → deployable →
maintainable" over enterprise completeness), the following are intentionally minimal, with
notes on how I'd extend them in production:

- **Token storage**: JWT lives in `localStorage`. In production I'd use an httpOnly cookie
  with refresh-token rotation to reduce XSS exposure.
- **Migrations**: one hand-written initial Alembic migration rather than an evolving
  migration history — appropriate for a from-scratch schema at this scope.
- **Order editing**: salesmen can build/review an order client-side before submit, but can't
  edit a *submitted* order — only admins can change its status (confirm/cancel). A
  production system would likely add an "amend pending order" flow.
- **Pagination**: list endpoints (`/customers`, `/products`, `/orders`) return full result
  sets rather than paginating — fine for demo-scale data, but would need `limit`/`offset` or
  cursor pagination at real scale.
- **Admin user management UI**: the backend supports admin-created accounts
  (`POST /api/users`), but the dashboard doesn't expose a UI for it yet — it can be
  exercised directly via `/docs`.

---

## 6. Repository Layout

```
sales-management-system/
├── backend/                # FastAPI + SQLAlchemy + Alembic + pytest
│   ├── app/
│   │   ├── routers/        # auth, users, customers, products, orders
│   │   ├── models.py       # SQLAlchemy models
│   │   ├── schemas.py      # Pydantic request/response schemas
│   │   ├── auth.py         # password hashing + JWT
│   │   ├── deps.py         # get_current_user, require_role(...)
│   │   ├── seed.py         # demo data + test credentials
│   │   └── main.py
│   ├── alembic/             # migrations
│   ├── tests/                # pytest suite
│   └── Dockerfile
├── admin-dashboard/         # React (Vite) — metrics, orders, customers, products
├── salesman-app/            # React (Vite) — customers, products, order creation, history
└── docker-compose.yml       # wires db + backend + both frontends together
```
