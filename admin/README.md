# PrimeCommerce Admin

A separate React 19 + Vite admin workspace for the PrimeCommerce quick-commerce application. The interface uses an original yellow/green PrimeCommerce design system and responsive layouts.

## Run locally

```powershell
cd admin
npm install
npm run dev
```

Open http://localhost:5174.

The app starts in mock mode so screens can be explored without a backend. Sample records live in `src/mocks.js`.

## Environment

Copy `.env.example` to `.env.local`. Keep mock mode enabled until the matching Express admin endpoints are implemented and tested.

- `VITE_ADMIN_MOCK=true`: use local sample data.
- `VITE_ADMIN_MOCK=false`: send requests through the Vite `/api` proxy.
- `ADMIN_API_TARGET`: Express server origin used by the dev proxy (default `http://localhost:5000`).
- `VITE_ADMIN_API_URL`: optional API base URL.

## Current implementation

The first implementation includes login demo entry, responsive sidebar/topbar, dashboard KPIs and charts, orders list/detail, live order board, product list/form, shared searchable/paginated tables, CSV export, and mock-backed operational sections for categories, inventory, stores, customers, delivery partners, marketing, payments, delivery settings, support, reports, settings and audit logs.

Mock-mode actions are local UI demonstrations only. They do not mutate production data. Connect each screen to a verified `/api/admin/*` endpoint before disabling mock mode.