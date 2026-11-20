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

The storefront now loads published products and categories from `/api/v1/products` and `/api/v1/categories`; it displays an explicit empty/loading/error state rather than silently substituting demo products. The existing Product, Category and SubCategory schemas are retained. Public catalog endpoints include `GET /api/v1/products`, `GET /api/v1/products/:id`, `GET /api/v1/categories` and `GET /api/v1/subcategories`. Admin-only endpoints include `POST/PATCH /api/v1/admin/categories`, `POST /api/v1/admin/subcategories`, `POST /api/v1/admin/products`, `PATCH /api/v1/admin/products/:id` and `DELETE /api/v1/admin/products/:id` (soft-unpublishes). Admin endpoints require the existing JWT auth middleware and an active user with `role: admin`. Product creation validates category/subcategory references and price/discount/stock values. Customer cart is now server-backed through authenticated cart APIs, saved addresses are scoped to the owning user, and a Cash on Delivery checkout creates an order after re-reading current database prices and atomically reserving available stock. Customers can view their own order history. Online payments now use Razorpay Orders API, a server-authoritative price snapshot, temporary stock reservation, signature verification and a raw-body signed webhook. Delivery fees/ETA, live inventory synchronization and customer-initiated cancellation/refunds are not implemented yet. Periodic rider GPS updates and customer tracking are implemented as described below.

## Verification still required

Run the client install/build/lint and server test suite in a checked-out environment. This GitHub connector can commit source files but does not execute the repository's npm scripts. Add integration tests for catalog filtering/pagination, product CRUD and RBAC, server-authoritative pricing, stock reservation, payment webhook idempotency and delivery state transitions before production use. Existing admin accounts must be granted `role: admin` through a trusted database/admin provisioning process; public registration must never accept a role field.


## Admin operations dashboard (current phase)

- `/admin` is a protected client route. The guard loads the signed-in user and checks the active `admin` role; server endpoints independently enforce JWT authentication and the database-backed admin middleware.
- `GET /api/v1/admin/overview` returns customer, published-product, category, order, paid-revenue and low-stock counts plus recent orders.
- `GET /api/v1/admin/products` and `GET /api/v1/admin/orders` provide admin-only inventory and order lists (latest 100).
- `PATCH /api/v1/admin/products/:id` uses the existing catalog admin endpoint for stock updates.
- `PATCH /api/v1/admin/orders/:id/status` allows processing, shipped and delivered status changes. Terminal cancellation/refund is intentionally not exposed in this UI because stock restoration and payment refunds are not implemented.
- Product creation/editing, customer management, picker/rider operations and periodic delivery tracking are implemented. Payment refunds and audit logs remain future work.


## Admin catalogue management (current phase)

- The protected admin workspace now includes product creation and editing, stock/price/discount/unit/description fields, image URL, publish visibility, and product unpublishing.
- Category creation/editing and subcategory creation are available from the admin catalogue section. Existing public category/subcategory read APIs are reused.
- Admin product writes use the existing `/api/v1/catalog/admin/*` endpoints, which enforce JWT authentication and the database-backed admin role.
- Product creation and updates validate that selected subcategories belong to the selected categories. Product images are currently supplied as URLs; a dedicated upload flow is not included yet.
- Category deletion, subcategory editing/deletion, bulk imports, image uploads and audit history remain future work.


## Customer management and sales analytics (current phase)

- Admin-only `GET /api/v1/admin/customers` supports bounded pagination (up to 50 per page) and search by customer name, email or exact numeric mobile. It returns only safe profile fields and never selects password hashes, refresh tokens or password-reset fields.
- Customer rows include order count and paid spend, where paid spend counts only `paid` or `completed` payment statuses.
- Admin-only `GET /api/v1/admin/reports/sales?period=7d|30d|90d` returns daily paid revenue, paid-order counts, total order counts and fulfilment status totals for the selected period. Unpaid COD orders are not represented as paid revenue.
- The admin workspace includes a paginated customer search table and sales report with period selection, daily revenue bars and fulfilment status breakdown.
- These reports are operational summaries, not a financial ledger; refunds, chargebacks, tax, delivery fees and settlement reconciliation are not yet modelled.


## Picker and rider operations (current phase)

- User roles now include `picker` and `rider`; public registration still creates only normal customer accounts. An administrator can promote an existing active customer account to picker/rider, or return it to the customer role.
- Admin-only `GET /api/v1/admin/staff` lists active fulfilment staff. Admin-only `POST /api/v1/admin/staff/role` updates an existing account role.
- Admin dispatch endpoints: `PATCH /api/v1/admin/orders/:id/assign-picker` assigns a picker to a processing order and moves it to `picking`; `PATCH /api/v1/admin/orders/:id/assign-rider` assigns a rider only after the order reaches `packed`, then moves it to `rider_assigned`.
- Orders store `pickerId`, `riderId`, `pickedAt` and `deliveredAt` assignment/timestamp fields.
- Picker APIs: `GET /api/v1/fulfilment/picker/orders` and `PATCH /api/v1/fulfilment/picker/orders/:id/status` (picker can mark its own assigned `picking` order as `packed`).
- Rider APIs: `GET /api/v1/fulfilment/rider/orders` and `PATCH /api/v1/fulfilment/rider/orders/:id/status` (assigned rider advances through `picked_up` and `out_for_delivery`). Delivery completion now requires customer OTP verification through `POST /api/v1/fulfilment/rider/orders/:id/verify-otp`.
- Staff APIs verify the active account role from the database on each request; a picker/rider can only read and update orders assigned to their own account.
- Dedicated `/picker` and `/rider` workspaces show assigned orders, item snapshots and delivery address details. Login redirects each role to its workspace.
- This phase provides manual refresh, status updates and opt-in periodic GPS sharing. It does not provide Socket.io updates, proof-of-delivery photos, rider earnings, route optimisation, FCM notifications or dedicated staff onboarding/password provisioning.
- The older admin order status endpoint remains for legacy `processing → shipped → delivered` orders. Newly dispatched orders use the picker/rider lifecycle above.


## Implemented delivery tracking increment

- Orders now store the rider's latest latitude, longitude and update timestamp.
- An authenticated rider can update coordinates only for an order assigned to that rider and only after pickup while the order is picked up or out for delivery.
- Customers can read tracking only for their own order. The API returns status, assigned rider contact details and the latest coordinates; delivered orders do not expose a stale location.
- Rider dashboard uses browser geolocation after the rider explicitly starts GPS sharing. Updates are throttled to at most one request per five seconds and stop when the rider stops sharing or the dashboard unmounts.
- Customer order history can poll the tracking endpoint every 10 seconds and open the latest coordinates in OpenStreetMap.
- This is periodic location refresh, not a continuous socket stream. Location sharing requires browser permission and a secure context (HTTPS, or localhost). There is no background tracking after the rider closes the dashboard, and no route/ETA calculation.


## Delivery OTP verification (current phase)

- When an order reaches `out_for_delivery`, its owner can request a six-digit delivery code using `POST /api/v1/orders/:id/delivery-otp`. Only the authenticated order owner can issue it.
- The API returns the code once to the customer and stores only its SHA-256 hash, expiry and failed-attempt counter. The code expires after 30 minutes; issuing a replacement invalidates the previous code.
- The rider can complete only their own assigned `out_for_delivery` order by submitting the code to `POST /api/v1/fulfilment/rider/orders/:id/verify-otp`. The server uses a timing-safe hash comparison and permits at most five incorrect attempts per issued code.
- The customer sees the code in their order tracking panel and shares it directly with the rider when the rider arrives. No SMS/WhatsApp/email delivery provider is configured, so the app does not claim to send the code automatically.
- Delivery completion through the rider workflow is OTP-gated; the generic rider status endpoint no longer accepts a direct `delivered` transition.


## Razorpay online payments (current phase)

- Checkout offers Cash on Delivery and Razorpay. The backend creates Razorpay orders using server-only `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`; the browser receives only the public key ID and gateway order details.
- The backend re-reads cart products and prices, atomically reserves stock, creates a pending order and clears the cart only after the gateway order and database order are created.
- `POST /api/v1/payments/razorpay/verify` verifies the checkout HMAC signature with a timing-safe comparison and fetches the payment from Razorpay before accepting its state. A captured payment becomes `paid`; an authorized payment waits for the signed webhook confirmation.
- `POST /api/v1/payments/razorpay/webhook` is mounted before JSON parsing and verifies the HMAC against the exact raw request body using `RAZORPAY_WEBHOOK_SECRET`. Captured/paid events must include the exact expected INR amount and a captured/paid state; failure events release the reserved stock. Conditional order-state updates make repeated state notifications safe to process.
- Pending online-payment reservations expire after 20 minutes. A server-side cleanup sweep marks expired reservations and restores stock. If a captured payment arrives after the reservation was released, the order is marked `paid_review_required` for manual support reconciliation rather than pretending inventory is still reserved.
- Configure all three Razorpay environment variables in the server deployment and register the webhook URL `/api/v1/payments/razorpay/webhook` for `payment.captured`, `order.paid` and `payment.failed`. Never commit live/test secrets.
- Admin picker/rider assignment and the legacy admin fulfilment transition now reject Razorpay orders until payment is `paid` or `completed`; COD remains eligible at placement.
- Run `npm test` from `server/` for regression tests covering webhook HMAC validation, exact INR amount checks and the online-payment fulfilment gate. The four pure unit tests pass in an isolated Node test run; full repository install/build and live Razorpay sandbox integration have not been run.
- This integration still requires sandbox end-to-end testing, deployment configuration, refund automation, webhook delivery monitoring and reconciliation for late/duplicate/exceptional payment states before production use. Razorpay REST API is called with Node built-in `fetch`; no SDK dependency was added.
