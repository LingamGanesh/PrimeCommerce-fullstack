# PrimeCommerce implementation progress

Last updated: 2026-11-20  
Working branch: fix/full-repository-audit  
Baseline audited commit: acaa1d4c476047153bfbb0df995c2ab8a89d5516  
Audit document: docs/AUDIT.md

Status meanings:
- DONE: implemented and verified with recorded evidence.
- PARTIAL: some implementation exists, but requirements or verification are incomplete.
- PENDING: not implemented or not verified.
- BLOCKED: requires external credentials, infrastructure, or user action.

## Phase checklist

| Phase / requirement | Status | Evidence / notes |
|---|---|---|
| Phase 1 — inspect repository structure and feature inventory | DONE | 158 tree entries / 131 files inventoried; client, server, admin, docs, configuration and CI reviewed |
| Phase 1 — inspect dependency declarations and lockfiles | DONE | client/server/admin package declarations and lockfile roots reviewed |
| Phase 1 — remediate npm audit advisories | DONE | Added compatible dependency remediation workflow; npm audit fix updated server/client lockfiles; both audits now report 0 vulnerabilities; remediation workflow 44777349844 passed backend tests (18/18), frontend lint and build |
| Phase 1 — npm audit | DONE | GitHub Actions npm audit logs inspected: client 21 advisories (16 high); server 15 advisories (8 high, 2 critical). Audit is non-blocking in workflow |
| Phase 1 — run frontend lint/build and backend tests | DONE | CI run 44768025216: install, lint, build and backend tests passed |
| Phase 1 — local MongoDB startup and seed | BLOCKED | User local log reports querySrv EBADNAME for literal <cluster-host>; local ignored .env cannot be inspected from GitHub |
| Phase 1 — browser auth/payment/checkout E2E | PENDING | No Playwright harness or live configured environment; not claimed as run |
| Phase 1 — write docs/AUDIT.md | DONE | Commit c0f6fde00d938a3abe2aa92d1eab453a11aa0a03 |
| Phase 1 — backend liveness/readiness and single dotenv bootstrap | DONE | /healthz and /readyz are now DB-independent/status-aware respectively; dotenv loads once in index.js; CI run 44774204891 passed 7/7 backend tests and frontend lint/build |
| Phase 1 — admin logout method and PrimeCommerce dashboard branding | DONE | Admin sign-out now uses POST /api/user/logout; audited dashboard wordmark/icon changed to PrimeCommerce; CI run 44774465829 passed |
| Phase 1 — catalogue active/deactivation visibility | DONE | Customer catalogue now excludes explicitly inactive categories/subcategories/products; legacy records without isActive remain visible; category/product deactivation and publish synchronization supported; CI 44774872063 passed 10/10 backend tests and frontend lint/build |
| Phase 1 — avatar upload file-signature validation | DONE | Added JPEG/PNG/GIF/WebP magic-byte validation after Multer and MIME-match enforcement; CI 44775373218 passed 12/12 backend tests and frontend lint/build |
| Phase 1 — mobile fields stored as strings | DONE for schema/write path | User and Address mobile fields are strings; profile/address writes and admin search preserve digit strings; idempotent `npm run migrate:mobile-to-string` converts existing numeric DB values; CI 44775958656 passed 14/14 backend tests and frontend lint/build |
| Phase 1 — address GeoJSON and default-address integrity | PARTIAL | Optional GeoJSON Point validation and 2dsphere index; create/edit accepts location/labels/instructions; first address/default replacement/deletion fallback; `npm run migrate:address-indexes` cleans legacy geo and creates unique partial default index; DB migration execution and API integration tests remain unverified; CI 44778178598 passed 20/20 backend tests and frontend lint/build |
| Phase 2 — canonical MongoDB schemas and migration | PARTIAL | Several models exist, but old/new duplicate fields remain; see AUD-004 to AUD-008 and AUD-021 |
| Phase 2 — full idempotent seed data | PARTIAL | Existing seed creates 15 categories, 30 subcategories, 60 products, one store, admin/customer/rider; required second store, manager/support/picker, 100+ products and sample orders are absent |
| Phase 3 — modular backend API foundation | PARTIAL | Existing auth/catalog/cart/address/checkout/orders/payments/admin/fulfilment/support routes; many target modules absent |
| Phase 3 — validation, centralized errors, permissions and audit logs | PENDING | No common validation middleware, permission enforcement, AuditLog model or central error envelope |
| Phase 3 — pricing engine and inventory reservation | PENDING | Current checkout uses product price and Product.stock; Inventory model is not connected |
| Phase 3 — order state machine and Socket.IO | PENDING | Legacy delivery_status transitions only; no status history or sockets |
| Phase 3 — payment ledger and refund reconciliation | PARTIAL | Razorpay verification/webhooks/full refund logic exist; Payment model is unused and sandbox tests are absent |
| Phase 4 — customer website | PARTIAL | Home/search/cart/address/checkout/orders/profile/support exist; serviceability, variant selector, product detail, wishlist, guest cart, full pricing and other flows are absent |
| Phase 5 — same-app admin | PARTIAL | Same-app admin dashboard currently covers overview, product/catalogue CRUD, stock, orders, customers, sales reports, picker/rider assignment, refund monitoring and support replies. Permissions/role coverage, CMS/coupons, audit logs and full workflow tests remain incomplete; standalone mock admin remains excluded from the production path |
| Phase 6 — rider/picker | PARTIAL | Assigned work queues, picker pack action, rider pickup/delivery, GPS while open and OTP completion exist; dispatch automation, availability, earnings and payouts are absent |
| Phase 7 — security hardening and tests | PARTIAL | Six pure backend unit tests and CI lint/build exist; critical/high npm advisories, API/component/E2E tests and security regression tests remain |
| Phase 8 — Docker, compose, deployment, CI E2E and full docs | PARTIAL | Deployment guide, architecture blueprint, Dependabot and CI for lint/build/unit tests exist; Docker, compose, Redis, E2E and complete API docs are absent |

## Regression / defect tracker

All audit items below remain OPEN unless a later row records a fix commit and test evidence. Do not change a status to DONE based only on code edits.

| ID | Priority | Status | Planned evidence before closure |
|---|---|---|---|
| AUD-001 | CRITICAL | DONE | Mongoose 9.12.2 and proxy-addr 2.0.8 in lockfile; server npm audit 0 vulnerabilities; remediation workflow passed tests |

| AUD-002 | HIGH | DONE | Axios 1.21.1, Vite 7.3.8 and React Router 7.18.6 locked; client npm audit 0 vulnerabilities; lint/build passed |

| AUD-003 | HIGH | DONE | Regression test verifies /healthz=200 and /readyz=503 while MongoDB is disconnected; CI 44774204891 passed |

| AUD-004 | HIGH | DONE | User.mobile is String; controller/admin query paths use strings; migration script added; 2 normalization tests; CI 44775958656 passed |

| AUD-005 | HIGH | PARTIAL | String mobile, GeoJSON validation, geospatial index, default-address transactions and unique partial index migration implemented; address edit API still pending |


| AUD-006 | HIGH | PENDING | Variant-aware product/cart API and regression tests |
| AUD-007 | CRITICAL | PENDING | Atomic Inventory reservation/consume/release concurrency tests |
| AUD-008 | HIGH | PENDING | Typed immutable order snapshots and status compatibility tests |
| AUD-009 | HIGH | PENDING | Pricing unit tests for fees, discounts, coupons, tax and rounding |
| AUD-010 | HIGH | PENDING | Payment ledger and webhook idempotency integration tests |
| AUD-011 | HIGH | PENDING | State transition and statusHistory tests |
| AUD-012 | HIGH | PENDING | Permission denial, store scoping and IDOR tests |
| AUD-013 | HIGH | PENDING | Mock app removed from production path; same-app admin uses real APIs |
| AUD-014 | HIGH | DONE | Admin UI now calls the existing POST /api/user/logout endpoint; CI run 44774465829 passed |

| AUD-015 | HIGH | DONE (scoped finding) | Audited AdminDashboard occurrence replaced; a full asset/legal-brand sweep remains a later QA task |

| AUD-016 | HIGH | PENDING | Role redirect and route/API permission matrix tests |
| AUD-017 | HIGH | PENDING | Idempotent seed creates required fixture counts and roles |
| AUD-018 | MEDIUM | DONE | Filter-builder tests cover inactive product/category/subcategory visibility and active category scoping; CI 44774872063 passed |

| AUD-019 | HIGH | DONE (signature validation) | Avatar upload rejects unsupported signatures and MIME spoofing; 2 regression tests; CI 44775373218 passed |

| AUD-020 | MEDIUM | PENDING | Consistent error envelope and production-safe error tests |
| AUD-021 | MEDIUM | PENDING | Migration consistency/orphan/duplicate checks and canonical indexes |
| AUD-022 | HIGH | PENDING | Guest cart persistence and authenticated merge tests |
| AUD-023 | MEDIUM | PENDING | Server-side search/filter/sort/pagination tests |
| AUD-024 | HIGH | PENDING | Route/component coverage for missing customer journeys |
| AUD-025 | HIGH | PENDING | API contract tests for missing modules |
| AUD-026 | HIGH | PENDING | Rider assignment timeout, availability and dispatch concurrency tests |
| AUD-027 | HIGH | PENDING | Authenticated socket room and event privacy tests |
| AUD-028 | MEDIUM | PENDING | Cross-domain cookie test matrix in supported browsers |
| AUD-029 | MEDIUM | PENDING | Rate-limit load/failure tests and edge limit configuration |
| AUD-030 | MEDIUM | PARTIAL | Added ticket message history, customer reply endpoint and UI; schema tests pass; end-to-end API authorization/reply tests remain pending |

| AUD-031 | MEDIUM | PENDING | Required domain models and migration tests |
| AUD-032 | MEDIUM | PENDING | Unit, integration, component and Playwright suites; CI gates |
| AUD-033 | LOW | DONE | Removed duplicate dotenv.config() calls from app and connectDB; index.js imports dotenv/config once before dynamic imports |
| AUD-034 | HIGH | PARTIAL | AdminCatalog sent the Publish checkbox on product creation, but createProduct ignored it and always relied on the schema default. The controller now validates and persists publish/isActive together; regression tests added for default-published, explicitly hidden and invalid values. CI/local execution still pending |

## Test evidence log

Latest catalog publication fix commits on `fix/full-repository-audit`: `9e2100b1739b0974b3989b1304d81f8e22e3b2e4` (helper), `929e506ecbf24e5d6e5859234d07eb03b0e7b443` (controller fix), `0a82aaad2ded0c63ae844e169b135d0ca6dca4a0` (regression tests). The new tests have not yet been executed in CI or on the user's machine.

Latest verified CI run: https://github.com/LingamGanesh/PrimeCommerce-fullstack/actions/runs/44778178598

| Command | Result |
|---|---|
| client: npm ci | PASS |
| client: npm run lint | PASS (latest CI 44778178598) |
| client: npm run build | PASS (baseline and latest CI 44775373218) |
| server: npm ci | PASS |
| server: npm test | PASS — latest CI 44778178598: 20 tests, 20 passed, 0 failed; new catalog publication tests added after this run and are pending execution |
| client: npm audit | PASS — 0 vulnerabilities after compatible audit fix (workflow 44777349844) |
| server: npm audit | PASS — 0 vulnerabilities after compatible audit fix (workflow 44777349844) |
| server: npm run seed against the user’s Atlas database | NOT VERIFIED |
| local server + browser auth/checkout | NOT VERIFIED |
| Razorpay sandbox/webhooks | NOT RUN |
| Playwright E2E and responsive checks | NOT RUN |

## Known blockers and external requirements

1. MongoDB Atlas: local server still reads a placeholder hostname. Replace it with the actual Atlas host in ignored server/.env. Rotate the MongoDB credential previously exposed in the conversation. Before starting with the new Address schema, run `npm run migrate:address-indexes`; run `npm run migrate:mobile-to-string` for existing phone records.
2. Resend: email verification and password-reset delivery require RESEND_API and a verified EMAIL_FROM sender.
3. Cloudinary: avatar upload requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.
4. Razorpay: online payments/refunds require test keys and webhook secret; sandbox verification has not been performed.
5. Production deployment: MongoDB replica-set/sharded transactions, same-site HTTPS frontend/API domains, correct CORS origins, independent JWT secrets and a frequent reservation-cleanup scheduler are required.

## Working rules for future updates

- Work only on fix/full-repository-audit unless the user explicitly approves another branch.
- Do not merge the open PR or push to main without explicit permission.
- Fix one logical unit at a time; add regression tests where practical.
- After each unit, record commit SHA, actual commands, pass/fail counts and limitations here.
- Never mark a feature DONE unless the behavior was run and verified.
- Do not use mock data in production flows; any external-service test mode must be explicitly labelled.
