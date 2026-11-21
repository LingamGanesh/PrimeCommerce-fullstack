# PrimeCommerce repository audit

Audit date: 2026-11-20  
Repository: https://github.com/LingamGanesh/PrimeCommerce-fullstack  
Audited ref: fix/full-repository-audit  
Audited commit: acaa1d4c476047153bfbb0df995c2ab8a89d5516  
Scope: repository tree (158 entries / 131 files), source/configuration review, latest GitHub Actions run and its dependency-audit/test logs.

## 1. Executive summary

The repository is a React/Vite + Express/Mongoose monorepo with a partially implemented quick-commerce customer flow and a small set of admin/fulfilment operations. It is not yet a complete production quick-commerce platform.

Latest CI run at the audited commit:
- Frontend dependency install: PASS
- Frontend ESLint: PASS
- Frontend Vite production build: PASS
- Backend dependency install: PASS
- Backend Node test suite: PASS (6 tests, 6 passed, 0 failed)

CI run: https://github.com/LingamGanesh/PrimeCommerce-fullstack/actions/runs/44768025216

A green CI result does not mean the product is production-ready. The workflow does not run browser tests, API integration tests, MongoDB transaction tests, payment sandbox tests, or an end-to-end order journey. Dependency audit is informational and non-blocking because the workflow uses npm audit --json ... || true.

Dependency audit at the same commit:
- client: 21 advisories — 1 low, 4 moderate, 16 high.
- server: 15 advisories — 5 moderate, 8 high, 2 critical.
- Direct high/critical dependencies include client Axios and Vite; backend Mongoose (critical), Multer (high), Morgan (moderate), and Resend (moderate). Transitive advisories include React Router, body-parser, proxy-addr, jws, lodash, qs, minimatch and others.
- npm audit reported fixes available for the listed advisories. Do not run a blanket forced upgrade without reviewing compatibility and rerunning the suite.

## 2. Repository structure and stack

The repository tree contains 158 entries, including 131 file blobs:
- .github: Dependabot and one CI workflow.
- admin: separate Vite application, mock data, mock login and admin UI.
- client: customer React application, routes, Redux user state, pages, components and utilities.
- server: Express app, MongoDB connection, controllers, middleware, Mongoose models, routes, seed script and two test files.
- docs: deployment guide and quick-commerce architecture blueprint.
- No docs/AUDIT.md or docs/PROGRESS.md existed at the audited commit.

Binary assets reviewed by file metadata rather than text: client logo.png, client react.svg, client vite.svg and admin favicon.svg.

### Frontend — client

Declared direct versions from client/package.json:
- React / React DOM ^19.2.0
- Vite ^7.2.4, @vitejs/plugin-react ^5.1.1
- React Router DOM ^7.10.1
- Redux Toolkit ^2.11.2, React Redux ^9.2.0
- Axios ^1.13.2
- Tailwind CSS ^4.1.18, @tailwindcss/vite ^4.1.18
- react-hot-toast ^2.6.0, react-icons ^5.5.0, react-type-animation ^3.2.0
- ESLint ^9.39.1 and React hooks/refresh plugins

Scripts: dev, build, lint, preview. No frontend test script.

### Frontend — admin

Declared direct versions from admin/package.json:
- React / React DOM ^19.2.0
- Vite ^7.2.4, React Router DOM ^7.10.1
- Redux Toolkit ^2.11.2, React Redux ^9.2.0
- TanStack Query ^5.90.11, Recharts ^2.15.4, lucide-react ^0.555.0
- Axios ^1.11.0
- react-hook-form ^7.66.1, @hookform/resolvers ^5.2.2, Zod ^4.1.12
- Tailwind CSS ^4.1.18

Scripts: dev, build, preview. No lint or test script. The current app implementation uses local state and static mock records; the form libraries are not used by the inspected admin app source and should be confirmed by a full import/reference search before removal.

### Backend — server

Declared direct versions from server/package.json:
- Express ^5.1.0
- Mongoose ^9.0.0, MongoDB driver ^7.0.0
- bcryptjs ^3.0.3, jsonwebtoken ^9.0.2
- cors ^2.8.5, cookie-parser ^1.4.7, dotenv ^17.2.3
- Helmet ^8.1.0, Morgan ^1.10.1, Multer ^2.0.2
- Cloudinary ^2.8.0, Resend ^6.6.0
- nodemon ^3.1.11

Scripts: start, dev, test (Node built-in test runner), seed. No server lint or build script.

Dependency review:
- The direct mongodb package is not imported in the reviewed server source; Mongoose supplies its MongoDB driver. Confirm before removing it.
- nodemon belongs in devDependencies rather than runtime dependencies.
- No dedicated validation package (Zod/Joi), mongo-sanitize, Socket.IO, BullMQ/Redis, Playwright, Supertest, mongodb-memory-server, or frontend test framework is declared.
- Admin package has no lockfile in the tracked tree; client and server have package-lock.json.
- No vulnerability remediation has been applied in this audit phase.

## 3. Feature inventory

| Area | Current implementation | Audit status |
|---|---|---|
| Customer registration/login | Email/password; bcrypt hash; cookie JWT; refresh token rotation | PARTIAL |
| Email verification | Token hash/expiry and Resend email in production or opt-in development | PARTIAL — external email key required |
| Forgot/reset password | Email OTP, hashed OTP, attempt limit, short-lived reset token | PARTIAL — Resend key required |
| Profile | Name/mobile/password update; password change revokes sessions | PARTIAL — email change not supported |
| Avatar | Multer memory upload + Cloudinary | PARTIAL — Cloudinary key required; MIME is trusted |
| Public catalogue | Product/category/subcategory list/detail endpoints | PARTIAL — no variants, store stock, robust search or CMS sections |
| Search | Basic name regex endpoint; frontend fetches a bounded product list and filters locally | PARTIAL |
| Cart | Authenticated database cart, add/update/remove, quantity/stock checks | PARTIAL — no guest cart merge or variant-aware controller |
| Addresses | Authenticated list/create/delete; owner scoping | PARTIAL — no edit/default selection/serviceability/map flow |
| COD checkout | Server rereads product price, conditionally decrements product stock, creates order and clears cart in a transaction | PARTIAL — no full pricing engine or Inventory model |
| Razorpay checkout | Gateway order, server-side amount verification, HMAC verification, raw webhook signature validation, payment reservation expiry | PARTIAL — needs sandbox tests, reconciliation and full Payment ledger |
| Orders | Customer list, tracking poll, cancel, delivery OTP | PARTIAL — legacy string snapshot and split status fields |
| Refunds | Full Razorpay refund request and webhook status reconciliation | PARTIAL — no partial refund or automated failed-refund retry |
| Admin dashboard in client | Overview, products/stock, catalogue, orders, customers, sales, picker/rider assignment, refunds and support | PARTIAL |
| Standalone admin app | Separate Vite app with mock login and static sample data | STUB / NOT PRODUCTION CONNECTED |
| Picker | Assigned queue and mark packed | PARTIAL |
| Rider | Assigned deliveries, pickup/out-for-delivery, GPS while dashboard open, OTP completion | PARTIAL |
| Support | Customer ticket create/list; admin status/latest reply | PARTIAL — no message history |
| Inventory/dark stores | Store and Inventory models exist; no complete inventory/store API | PENDING |
| Variants | Variant model exists; customer/admin/cart/checkout flow does not use it | PENDING |
| Coupons/pricing | Coupon/AppConfig models exist; no coupon API or central pricing engine | PENDING |
| Banners/home sections | Models and seed records exist; customer/admin APIs are absent | PENDING |
| Wallet | walletBalance field only | PENDING |
| Notifications | Notification model only | PENDING |
| Reviews | No Review model/API/UI | PENDING |
| Rider onboarding/KYC/payouts | Minimal Rider model; no onboarding/payout workflow | PENDING |
| Role/permission management | permissions array exists; no Role model or permission matrix | PENDING |
| Audit logs | No AuditLog model or audit UI | PENDING |
| Realtime | No Socket.IO server or authenticated socket rooms | PENDING |
| Invoice/PDF | Not implemented | PENDING |
| PWA/SEO/i18n/accessibility QA | Basic document metadata only; no full implementation/verification | PENDING |
| Docker/compose/Redis/CI E2E | Not present | PENDING |

## 4. Confirmed bugs and gaps

Statuses below describe the audited baseline. No application bug fixes were made in this audit-only phase; each OPEN item needs a separate implementation commit and regression evidence.

| ID | Severity | File / location | Reproduction or evidence | Root cause | Fix plan | Status |
|---|---|---|---|---|---|---|
| AUD-001 | CRITICAL | server/package-lock.json; dependency-remediation CI | Baseline server audit reported 2 critical advisories affecting Mongoose and proxy-addr | Locked direct/transitive versions were inside vulnerable ranges | Ran compatible `npm audit fix`; lockfile now resolves Mongoose 9.12.2 and proxy-addr 2.0.8; server audit reports 0 vulnerabilities and backend tests pass | FIXED — commit 62caa234a3d442c0f5c4dbc17d5208a2440ec482 |
| AUD-002 | HIGH | client/package-lock.json; dependency-remediation CI | Baseline client audit reported 21 advisories, including 16 high, affecting Axios, Vite and transitive packages | Locked dependency versions fell inside advisory ranges | Ran compatible `npm audit fix`; lockfile now resolves Axios 1.21.1, Vite 7.3.8 and React Router 7.18.6; client audit reports 0 vulnerabilities and lint/build pass | FIXED — commit 62caa234a3d442c0f5c4dbc17d5208a2440ec482 |
| AUD-003 | HIGH | server/app.js | When MongoDB is unreachable, the global connection middleware previously returned 503 before /healthz executed | DB connection middleware was mounted before health route and wrapped every request | Added DB-independent /healthz liveness and /readyz database readiness before DB middleware; regression-tested disconnected state | FIXED — commit 0b306fc25eade66a3985b5b287de34f59f000482 |
| AUD-004 | HIGH | server/models/user.model.js; server/controllers/user.controller.js; server/controllers/admin.controller.js | User mobile was stored as Number and profile updates converted it back to Number | Numeric storage can discard leading zeroes and formatting | Changed User.mobile to String, preserve normalized digit strings in profile updates, and update admin search; added idempotent migration command for existing numeric records. Any leading zero already lost in historical numeric values cannot be reconstructed | FIXED — commits 65e99a27358cf2c3902b296438c76fbbd8a10121 through 30b357a09fa236679efef756750c46f652a2a62f |
| AUD-005 | HIGH | server/models/address.model.js; server/controllers/address.controller.js; server/scripts/migrateAddressIndexes.js | Address model lacked a 2dsphere index and complete geo/default handling; no edit endpoint exists | Address schema/API was only a partial expansion of legacy address shape | Mobile fields are strings; optional GeoJSON Point is validated; customer create/edit accepts house/floor/landmark/instructions/coordinates; first address becomes default, explicit default replaces the previous one, editing/unsetting and deleting a default promotes/retains one default. Migration cleans invalid legacy geo, deduplicates defaults and creates user, 2dsphere and unique partial default indexes. Migration execution against the live database and API integration/IDOR tests remain unverified | PARTIAL — commits 1550e336aa0c029fa47ae21fb6afc796f469e37a through 4bea5e19fb6b00e888fba2a89923b8a382cdd552 |
| AUD-006 | HIGH | server/models/product.model.js:13-62; server/models/variant.model.js; server/controllers/cart.controller.js | Product has legacy image/category/price/stock plus newer images/subCategoryId/isActive; cart controller only accepts productId and ignores variantId | Schema migration was additive but the business flow remains on legacy product-level fields | Establish one canonical product/variant contract; migrate old data; make cart rows variant-aware | OPEN |
| AUD-007 | CRITICAL | server/models/inventory.model.js; server/controllers/checkout.controller.js:28-60; server/controllers/payments.controller.js:59-74 | Checkout decrements Product.stock; Inventory.quantity/reserved are not consulted or changed | Inventory model is disconnected from checkout and fulfilment | Use atomic Inventory reserve/release/consume by storeId+variantId; add concurrency tests | OPEN |
| AUD-008 | HIGH | server/models/order.model.js:8-35; server/controllers/checkout.controller.js; server/controllers/payments.controller.js | Order schema defines status/statusHistory/items/pricing/paymentStatus but checkout populates product_details string, delivery_status and payment_status | Two parallel order contracts exist; new typed snapshots and history are not wired | Migrate to typed immutable items/address/pricing snapshots; keep one status/payment vocabulary | OPEN |
| AUD-009 | HIGH | server/controllers/checkout.controller.js:8-60; client/src/pages/Checkout.jsx:131 | Checkout total is subtotal; no delivery, handling, small-cart, platform, rain/surge, GST, coupon, wallet or tip calculation | No shared server pricing engine or preview endpoint | Implement pure pricing service and unit tests; expose preview; never accept client totals | OPEN |
| AUD-010 | HIGH | server/controllers/payments.controller.js:40-74,185-290; server/models/payment.model.js | Payment model is not imported/used by payment controller; order/payment state is persisted mainly on legacy Order fields | Payment ledger/idempotency model is not integrated | Persist Payment records with unique gateway IDs, idempotent webhook/event processing and reconciliation tests | OPEN |
| AUD-011 | HIGH | server/controllers/admin.controller.js:42-49; server/models/order.model.js:8-11 | Admin status endpoint always returns 409; order statusHistory is not appended by picker/rider transitions | Required server-enforced state machine is not implemented; legacy delivery_status remains authoritative | Implement explicit transition service, actor/time history, permission checks and event emission | OPEN |
| AUD-012 | HIGH | server/middleware/admin.js; server/routes/admin.routes.js:9-22; server/models/user.model.js:116-123 | All admin routes require role exactly admin; permissions array is not checked; no store scoping exists | Role-only middleware rather than requireAdmin(permission) and scoped authorization | Implement role/permission middleware and store-manager query scoping; test denial and cross-store IDOR | OPEN |
| AUD-013 | HIGH | admin/src/api.js; admin/src/app.jsx; admin/.env.example; admin/README.md | Default mockMode is true; demo login accepts arbitrary credentials and records are imported from mocks.js; API calls do not match the actual /api/v1/admin backend | A separate standalone admin app was scaffolded and not integrated with the customer app/backend contract | Do not ship mock app as production admin; consolidate or remove it after moving needed UI into client routes; add real auth and API tests | OPEN |
| AUD-014 | HIGH | client/src/pages/AdminDashboard.jsx; server/routes/user.routes.js | Admin sign-out previously called GET /api/user/logout while backend exposes POST /logout | HTTP method mismatch | Changed admin sign-out request to POST to match the protected backend route; frontend CI build/lint passed | FIXED — commit 17a9caaf1c95fe29e2ef316e60742db26694b7c8 |
| AUD-015 | HIGH | client/src/pages/AdminDashboard.jsx | Client admin dashboard displayed a third-party wordmark and letter icon | Admin scaffold used the target brand label instead of the PrimeCommerce identity | Replaced the dashboard wordmark and icon with PrimeCommerce branding; a repository-wide trademark/asset review remains advisable | FIXED for the audited dashboard occurrence — commit 17a9caaf1c95fe29e2ef316e60742db26694b7c8 |
| AUD-016 | HIGH | client/src/components/AdminGuard.jsx:25; client/src/pages/LoginPage.jsx:59; server/models/user.model.js:116-123 | Admin guard accepts only admin; login redirects only admin, picker, rider; store_manager/support/marketing/catalog_manager are not handled | Frontend and schema role matrix is incomplete | Define canonical roles; redirect privileged roles to /admin; add PermissionGate and backend permission checks | OPEN |
| AUD-017 | HIGH | server/scripts/seed.js:15-75, 100-170 | Seed creates 15 categories, 30 subcategories, 60 products, one store, one admin, one customer and one rider; no store manager/support/picker/second store/sample orders | Seed script is a small development starter, not the requested full fixture set | Expand to required roles, 2 stores, 100+ products/variants/stock, marketing config and sample orders; test idempotency | OPEN |
| AUD-018 | MEDIUM | server/controllers/catalog.controller.js; server/utils/catalogVisibility.js | Public catalogue previously returned inactive categories and did not consistently respect product/subcategory isActive | New isActive and legacy publish fields could diverge | Public product/category/subcategory queries now filter inactive records while retaining legacy records where isActive is absent; category/product admin updates can deactivate and product publish/isActive are synchronized | FIXED — commits 6856c5ec78e36cd8f111e38377ab0d5c0b57e9c3 and 209c77054e0dc0f728f7aa3130feef104d123896 |
| AUD-019 | HIGH | server/middleware/multer.js; server/middleware/validateImageUpload.js; server/utils/imageSignature.js | Avatar upload previously trusted the multipart MIME header without checking file bytes | A client could label arbitrary bytes as an allowed image MIME type | Added JPEG/PNG/GIF/WebP signature detection and required detected MIME to match multipart MIME before Cloudinary upload; tests cover spoofed and unsupported files. Image dimensions/decoder validation remain a separate hardening item | FIXED for signature/MIME mismatch — commit be7cad9c7f2aed5bb3f7ef410bc0c2aa0025e160 |
| AUD-020 | MEDIUM | server/app.js; server/controllers/*; server/middleware/* | No central error middleware or common validation middleware; controllers handcraft response envelopes and often expose raw error.message | Error handling and validation are duplicated and inconsistent | Add central error shape, request validation schemas, safe production errors and request IDs | OPEN |
| AUD-021 | MEDIUM | server/models/category.model.js; server/models/subCategory.model.js; server/models/product.model.js; server/models/address.model.js | Address/category/product relations are only partly normalized; category/subcategory legacy arrays coexist with parentId and singular subCategoryId; no Product text index | Migration is additive and leaves multiple relationship representations | Define canonical relations and indexes; write data migration and duplicate/orphan checks | OPEN |
| AUD-022 | HIGH | client/src/pages/Home.jsx:26,71; client/src/pages/SearchPage.jsx:66-82 | Guest cart initializer always returns empty; add actions redirect unauthenticated users to login | No local guest cart or post-login merge implementation | Implement guest cart with validated server merge on login; add component/integration tests | OPEN |
| AUD-023 | MEDIUM | client/src/pages/Home.jsx; client/src/pages/SearchPage.jsx | Home fetches at most 60 products; search fetches at most 100 and filters locally; no infinite scroll/server pagination UI or suggestions | Catalogue browsing is a bounded prototype | Use server-side query/filter/sort/pagination and suggestion/recent/trending endpoints | OPEN |
| AUD-024 | HIGH | client/src/route/index.jsx; client/src/pages/* | No dedicated category, product detail, location/serviceability, wishlist, invoice or order-detail/tracking route; tracking is a polling panel inside order history | Customer experience is only partially built | Implement missing customer flows while preserving existing working UI | OPEN |
| AUD-025 | HIGH | server/routes/*; server/controllers/* | No coupon, wallet, notification, store, inventory, wishlist, review, rider payout, CMS, audit-log or admin-role APIs | Models/scaffolding exist without service/controller/routes | Implement API modules and contract/integration tests in dependency order | OPEN |
| AUD-026 | HIGH | server/controllers/fulfilment.controller.js; server/models/rider.model.js | Rider can progress only after manual admin assignment; no online/offline, availability, 30-second accept/reject, nearest-rider reassignment, earnings or payouts | Minimal assigned-order workflow only | Implement rider availability/dispatch service and timeout job; add concurrency and assignment tests | OPEN |
| AUD-027 | HIGH | server/app.js; server/controllers/fulfilment.controller.js; client/src/pages/Myorders.jsx | No Socket.IO server; customer polls tracking every 10 seconds; rider GPS only works while dashboard is open | No authenticated real-time transport or background location service | Add authenticated socket rooms and event authorization; retain polling fallback; disclose mobile OS limitations | OPEN |
| AUD-028 | MEDIUM | server/middleware/auth.js; server/app.js; docs/DEPLOYMENT.md | Production cookies use SameSite=None and Secure; separate default Vercel domains are cross-site and can be blocked as third-party cookies | Cross-site cookie policy varies by browser/privacy mode | Prefer same-site custom domains; verify login/refresh/logout in Safari/Chrome privacy modes; document exact deployment topology | OPEN |
| AUD-029 | MEDIUM | server/middleware/rateLimit.js; server/app.js | Rate limiter stores counters in MongoDB and every request is forced through DB connection middleware | Auth throttling depends on Mongo availability; no independent edge limiter or global request budget | Keep bounded DB limiter if appropriate; add edge/proxy limits and explicit failure policy | OPEN |
| AUD-030 | MEDIUM | server/models/supportTicket.model.js; server/controllers/support.controller.js; client/src/pages/Support.jsx | Support tickets previously stored only the original message and latest admin reply | No conversation history or customer follow-up endpoint | Added timestamped customer/admin message records, customer reply endpoint, admin reply append, and customer conversation UI; legacy message/reply fields remain readable. Schema tests and frontend build pass; full API integration/authorization tests remain pending | PARTIAL — commits 2ab18b15c6518cd9136952a8d4ed1ecc72e3e1fd through 111ad8cb0980914ab7a6a387d0e9da4cbe31fc82 |
| AUD-031 | MEDIUM | server/models/*; server/controllers/* | Missing RiderPayout, Review, Role, AuditLog, Wishlist and batch/supplier/purchase-entry models | Required domain model coverage is incomplete | Add models and migrations only alongside the corresponding API workflows | OPEN |
| AUD-032 | MEDIUM | server/package.json; client/package.json; admin/package.json | Backend has no lint script; client has no test script; admin has no lint/test scripts; no E2E runner | Quality gates cover only lint/build and six pure backend tests | Add unit/integration/component/Playwright tests and make security audit blocking after remediation | OPEN |

### Local environment issue reported during this audit

The user’s local server log reports:

    querySrv EBADNAME _mongodb._tcp.<cluster-host>

This proves the local server is still reading a MongoDB URI with the literal placeholder host. The local server/.env file is gitignored and is not accessible through the repository audit. Replace the placeholder with the exact MongoDB Atlas driver hostname locally. A MongoDB credential was exposed in the conversation; rotate it in Atlas and use only the new value in the local ignored .env file. No credential is reproduced in this report.


| AUD-033 | LOW | server/index.js; server/app.js; server/config/connectDB.js | Startup printed repeated dotenv injection messages because three modules called dotenv.config() | Environment loading was duplicated across entrypoint, app and DB module | Removed module-level dotenv initialization from app/DB; index.js now loads dotenv/config once before dynamically importing modules | FIXED — commit 0b306fc25eade66a3985b5b287de34f59f000482 |

## 5. Architecture mapping: existing code to target

| Target module | Existing location | Current boundary |
|---|---|---|
| Auth | server/controllers/user.controller.js, routes/user.routes.js, middleware/auth.js | Existing email/password, verification, reset, refresh, logout |
| User/profile | User model and user controller | Basic profile/avatar only |
| Address | Address model/controller/routes | List/create/delete; no edit/default/serviceability |
| Catalog/search | Product/Category/SubCategory models; catalog controller/routes | Basic CRUD/list; legacy fields still authoritative |
| Cart | CartProduct model; cart controller/routes | Authenticated product-level cart |
| Checkout/pricing | checkout controller and payment controller | COD/Razorpay subtotal-only checkout |
| Orders | Order model, orders/cancellation controllers and routes | Legacy string snapshot and delivery_status |
| Payments | Payment model and payments controller | Razorpay logic uses Order fields; Payment model unused |
| Inventory/store | Inventory/Store models | No complete operational APIs; Product.stock used |
| Admin | admin middleware/controller/routes and client AdminDashboard/AdminCatalog | Role=admin only; limited screens |
| Picker/rider | fulfilment controller/routes, Rider model, FulfilmentDashboard | Manual assignment and limited state changes |
| Support | SupportTicket model and support controller/routes | One message plus latest reply |
| Marketing/CMS | Banner/HomeSection/Coupon/AppConfig models | No complete read/write APIs |
| Notifications/wallet | Notification model and User.walletBalance | No workflows |
| Realtime/jobs | None; setInterval reservation sweep and protected cron endpoint | No Socket.IO, queue or persistent scheduler |
| Tests | server/tests/orderPolicy.test.js and paymentSecurity.test.js | Six pure unit tests only |

## 6. Security and data-integrity observations

Positive controls already present:
- Passwords use bcryptjs.
- Access/refresh tokens are in httpOnly cookies; refresh tokens are hashed in MongoDB and rotated with compare-and-swap.
- Logout/password reset increments tokenVersion.
- Cookie-authenticated unsafe requests validate Origin.
- Razorpay webhook is mounted with raw-body parsing before express.json and validates HMAC.
- Cart/address/order/support queries generally scope to req.userId.
- Stock decrements use conditional updates within MongoDB transactions for current product-level stock.
- Delivery OTP is hashed, expires, has attempt limits and is checked with timing-safe comparison.
- Customer tracking only returns data for the authenticated order owner.

Gaps to close before production:
- Critical/high npm audit advisories listed above.
- No global mongo-sanitize / Mongoose sanitization strategy; Mongoose itself is in a critical advisory range at the audited lock.
- Role permission arrays are not enforced; no store-manager data scoping.
- Uploads trust MIME headers without signature inspection.
- Several controllers return error.message to the caller.
- Order/payment/inventory duplicated representations can drift.
- No end-to-end proof that admin catalog changes appear in customer catalog and customer orders appear in admin in real time.
- No independent security test suite for IDOR, auth, CSRF, rate limits, payment replay or inventory races.

## 7. Test and execution evidence

| Command/check | Where run | Result |
|---|---|---|
| npm ci (client) | GitHub Actions, Node 22 | PASS |
| npm run lint (client) | GitHub Actions | PASS |
| npm run build (client) | GitHub Actions | PASS |
| npm ci (server) | GitHub Actions, Node 22 | PASS |
| npm test (server) | GitHub Actions | PASS — 6 tests, 6 passed, 0 failed |
| npm audit (client) | GitHub Actions | Security posture FAIL — 21 advisories; audit step non-blocking |
| npm audit (server) | GitHub Actions | Security posture FAIL — 15 advisories; includes 2 critical; audit step non-blocking |
| MongoDB-backed seed | User local machine | NOT VERIFIED — URI currently resolves to placeholder hostname |
| Server startup / auth flow / browser flow | User local machine | NOT VERIFIED by this audit |
| Razorpay sandbox/webhook | External integration | NOT RUN |
| Playwright E2E / responsive 360/768/1280 | No test harness in repo | NOT RUN |

CI run details: https://github.com/LingamGanesh/PrimeCommerce-fullstack/actions/runs/44768025216

## 8. Audit phase exit criteria

Phase 1 audit documentation is complete for the inspected repository baseline. Application fixes are intentionally not included in this audit-only commit. The next implementation phase must:
1. Remediate vulnerable dependencies, starting with Mongoose and its transitive proxy-addr dependency.
2. Establish canonical data contracts and migration compatibility.
3. Connect Inventory/Variant/Order/Payment models to the actual workflows.
4. Consolidate admin into the same client app and remove mock-only behavior from production paths.
5. Add regression coverage before marking each issue FIXED.

Do not mark any OPEN issue as complete until a fix commit and corresponding test evidence are recorded in docs/PROGRESS.md.
