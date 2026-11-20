# Quick-commerce transformation — implementation blueprint

## Repository baseline (20 Nov 2026)

- Existing repository: `LingamGanesh/PrimeCommerce-fullstack`, default branch `main`.
- Frontend: React 19 + Vite 7, React Router 7, Redux Toolkit, Tailwind CSS 4, Axios and react-hot-toast (`client/package.json`).
- Backend: Express 5, Mongoose 9 / MongoDB, JWT, bcryptjs, Helmet, Multer and Cloudinary (`server/package.json`).
- Existing working foundation: email/password registration and login routes, refresh-token route, user details/profile routes, avatar upload, React Router customer pages and Redux user state.
- The current homepage is a placeholder. The Express app currently mounts only `/api/user`; quick-commerce catalog/cart/order/admin/delivery APIs are not yet present.
- The repository is already a monorepo with `client/` and `server/`; retain this structure and evolve the backend as a modular monolith.

## Target architecture

Keep the current React/Vite customer application and Express/Mongoose backend. Organize backend features as modules before considering microservices:

```text
client/src/
  components/       shared header, search, product card, cart controls
  pages/            Home, Search, Category, Product, Cart, Checkout, Orders, Profile
  features/         auth, catalog, cart, address, orders
  services/         API client and realtime client
  store/            existing Redux store and slices
server/
  config/           database, environment, integrations
  modules/
    auth/ user/ address/ catalog/ cart/ inventory/ store/
    checkout/ order/ payment/ coupon/ rider/ picker/
    admin/ analytics/ notification/ support/
  middleware/       auth, RBAC, validation, errors, rate limits
  sockets/ jobs/ utils/
```

## Domain model

Users/roles, addresses (GeoJSON Point), categories, products, variants, stores (GeoJSON Point/Polygon), inventory, carts, orders, payments, coupons, banners, home sections, riders, picker assignments, notifications, support tickets, reviews, admin roles and audit logs.

Add 2dsphere indexes for geo fields, unique SKU and store+variant inventory constraints, and idempotency keys for order/payment operations. Keep prices authoritative on the server. Reserve stock atomically and release reservations on payment failure/timeout.

## API boundaries

Use a versioned `/api/v1` namespace for customer, catalog, cart, checkout, orders, tracking, rider, picker and admin endpoints. Keep the existing `/api/user` endpoints backward-compatible during migration, then consolidate only after client references are updated.

## Workflow

`PLACED → CONFIRMED → PICKING → PACKED → RIDER_ASSIGNED → PICKED_UP → OUT_FOR_DELIVERY → DELIVERED`

Cancellation/refund transitions must be validated against current order state. Payment webhooks and order creation must be idempotent. Rider location updates and order status changes can later be broadcast through Socket.IO.

## Delivery phases

1. Foundation: repository audit, design tokens, customer home, reusable product/cart UI.
2. Catalog: connect the existing category/product models to public catalog APIs, admin-only product CRUD, search and store resolution.
3. Cart and checkout: address book, pricing service, coupons, stock reservation and payment test mode.
4. Fulfilment: order lifecycle, picker workflow, rider assignment, delivery OTP and tracking.
5. Operations: admin analytics, inventory, dark stores, customer/rider management, RBAC, reports and support.
6. Production readiness: push notifications, monitoring, Docker/CI, deployment, accessibility and automated tests.

## Current change

The storefront now loads published products and categories from `/api/v1/products` and `/api/v1/categories`; it displays an explicit empty/loading/error state rather than silently substituting demo products. The existing Product, Category and SubCategory schemas are retained. Public catalog endpoints include `GET /api/v1/products`, `GET /api/v1/products/:id`, `GET /api/v1/categories` and `GET /api/v1/subcategories`. Admin-only endpoints include `POST /api/v1/admin/products`, `PATCH /api/v1/admin/products/:id` and `DELETE /api/v1/admin/products/:id` (soft-unpublishes). Admin endpoints require the existing JWT auth middleware and an active user with `role: admin`. Product creation validates category/subcategory references and price/discount/stock values. The browser cart is still local-only; checkout, server-side stock reservation, payment, live inventory and delivery tracking are not implemented yet.

## Verification still required

Run the client install/build/lint and server test suite in a checked-out environment. This GitHub connector can commit source files but does not execute the repository's npm scripts. Add integration tests for catalog filtering/pagination, product CRUD and RBAC, server-authoritative pricing, stock reservation, payment webhook idempotency and delivery state transitions before production use. Existing admin accounts must be granted `role: admin` through a trusted database/admin provisioning process; public registration must never accept a role field.
