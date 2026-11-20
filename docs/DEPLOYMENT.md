# Production deployment guide

This repository is a monorepo with a Vite frontend in `client/` and an Express API in `server/`. On Vercel, create **two separate Vercel projects connected to the same GitHub repository**: one with Root Directory `client` for the frontend, and another with Root Directory `server` for the Express backend. The backend exports its Express app from `server/app.js`; Vercel detects it as a Node.js Function. Keep the local `npm start` command for non-Vercel hosting and local development.

Vercel Express reference: https://vercel.com/docs/frameworks/backend/express

## 1. MongoDB

1. Create a MongoDB Atlas cluster.
2. Create a database user with a strong password.
3. Add the backend hosting provider's outbound IPs to the Atlas network allowlist (or use a carefully reviewed network policy).
4. Copy the application connection string into the backend environment as `MONGODB_URI`. URL-encode special characters in the database password.

## 2. Backend (Render example)

Create a Node web service connected to this repository:

- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`
- Health-check path: `/healthz`

Set these environment variables in the backend service dashboard:

| Variable | Required | Purpose |
|---|---|---|
| `NODE_ENV` | Yes | Set to `production` |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `SECRET_KEY_ACCESS_TOKEN` | Yes | Unique random secret, at least 32 characters |
| `SECRET_KEY_REFRESH_TOKEN` | Yes | Different unique random secret, at least 32 characters |
| `FRONTEND_URL` | Yes | Canonical frontend origin, used in verification emails and CORS |
| `FRONTEND_URLS` | No | Comma-separated extra exact origins allowed by CORS |
| `RESEND_API` | For email | Resend API key for verification and password reset emails |
| `EMAIL_FROM` | For email | Verified sender identity |
| `CLOUDINARY_CLOUD_NAME` | For image uploads | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | For image uploads | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | For image uploads | Cloudinary API secret |
| `RAZORPAY_KEY_ID` | For online payments | Razorpay test/live public key ID |
| `RAZORPAY_KEY_SECRET` | For online payments | Razorpay test/live API secret |
| `RAZORPAY_WEBHOOK_SECRET` | For online payments | Secret configured on the Razorpay webhook |

Generate independent token secrets with a cryptographically secure random generator. Do not reuse the MongoDB password, Razorpay secret or each other. Never commit real values to Git.

The API listens on the hosting provider's `PORT`. The `/healthz` endpoint returns HTTP 200 only after MongoDB is connected and HTTP 503 otherwise.


## 2. Backend on Vercel

Create a new Vercel project and import this same GitHub repository:

- Project name: for example, `primecommerce-api`
- Root Directory: `server` (enable the option to include files outside the root directory only if Vercel prompts for it; this backend imports only files inside `server/`)
- Framework Preset: Other / Express auto-detection
- Build command: leave the default / no custom build command
- Output directory: leave blank
- Install command: `npm install`

Vercel detects the default-exported Express app in `app.js` and runs it as a serverless function. Do not configure `npm start` as a custom build command. The serverless app connects to MongoDB on incoming requests and reuses a warm connection. The traditional `index.js` remains the local long-running server entrypoint.

Add the backend environment variables listed above in **Vercel → Project → Settings → Environment Variables**. Add them to Production (and Preview only if you have separate test credentials). In particular:

- `NODE_ENV=production`
- `MONGODB_URI`
- `SECRET_KEY_ACCESS_TOKEN` and `SECRET_KEY_REFRESH_TOKEN` (different random values, at least 32 characters each)
- `FRONTEND_URL` = the exact deployed frontend origin, e.g. `https://your-store.vercel.app`
- `FRONTEND_URLS` = optional comma-separated additional origins; if omitted, `FRONTEND_URL` is used
- `CRON_SECRET` = a long random secret if you configure an external scheduler for reservation cleanup
- Email, Cloudinary and Razorpay variables as required by the features you enable

After changing environment variables, redeploy the backend. Your backend URL will look like `https://your-api-project.vercel.app`. Verify `https://YOUR-API-DOMAIN/healthz` returns HTTP 200 and `{"status":"ok","database":"connected"}`.

The protected reservation cleanup endpoint is `GET /api/cron/expire-reservations`. It requires `Authorization: Bearer YOUR_CRON_SECRET`. Configure a trusted external scheduler to call it every 5 minutes if you need timely release of expired Razorpay stock reservations. Do not leave `CRON_SECRET` unset if you expose this route for scheduled use. Vercel Hobby cron schedules are limited to daily execution, which is too infrequent for the 20-minute payment reservation window; a more frequent scheduler requires a suitable plan or an external scheduler.

## 3. Frontend on Vercel

Create a Vercel project from the same repository:

- Root Directory: `client`
- Framework preset: Vite (auto-detected)
- Build command: `npm run build`
- Output directory: `dist`

Set the build environment variable:

- `VITE_API_BASE_URL`: the deployed Vercel backend origin, e.g. `https://your-api-project.vercel.app` (no trailing slash)

Redeploy the frontend after setting or changing this variable. Vite embeds `VITE_*` values into the browser bundle; never put private keys or secrets in frontend environment variables.

If using a different static host, configure SPA fallback so application routes such as `/orders`, `/profile` and `/admin` serve `index.html`.

## 4. CORS, cookies and custom domains

1. Set `FRONTEND_URL` in the backend Vercel project to the exact deployed frontend origin, including `https://` and excluding a trailing slash.
2. Add any additional frontend/admin origins to `FRONTEND_URLS`, comma-separated.
3. The production API rejects browser origins that are not in this allowlist.
4. Keep frontend and API on HTTPS. Authentication cookies use `Secure` and `SameSite=None` in production. For reliable browser sessions, use custom domains on the same registrable domain (for example, `shop.example.com` and `api.example.com`). Separate default `*.vercel.app` project domains are cross-site; browsers that block third-party cookies may block login/session cookies even when CORS is configured. If you use separate Vercel domains, test login, refresh and logout in Safari and Chrome privacy settings before launch.
5. If using custom domains, update the allowlist and redeploy the backend. Avoid broad wildcard CORS origins.

## 5. Razorpay webhook

In the Razorpay dashboard, register:

`https://YOUR-BACKEND-DOMAIN/api/v1/payments/razorpay/webhook`

Subscribe to:

- `payment.captured`
- `order.paid`
- `payment.failed`
- `refund.processed`
- `refund.failed`

Use the exact same webhook secret in the Razorpay dashboard and `RAZORPAY_WEBHOOK_SECRET`. Start with Razorpay test mode and complete a full test checkout before switching to live credentials. Verify webhook delivery and refund events in the Razorpay dashboard.

## 6. Post-deployment smoke test

- Open `https://YOUR-API-PROJECT.vercel.app/healthz`; confirm HTTP 200 and database connected.
- Open the frontend and verify product/category loading.
- Register a test account and confirm the verification email arrives.
- Log in, refresh the page, and verify the session remains active.
- Test logout and confirm protected pages require login again.
- Upload a profile image and verify the Cloudinary URL loads.
- Add an item to cart, save an address, and place a COD test order.
- Test Razorpay sandbox checkout, payment verification, webhook delivery, failed-payment stock release and refund events.
- Test admin, picker and rider accounts separately; verify role restrictions.
- Check backend logs for errors and verify no secrets are exposed in frontend requests or Git history.

## Important limitations

A green CI build is not proof of a successful live deployment. Browser-based customer-to-delivery testing, Razorpay sandbox end-to-end testing, webhook monitoring and operational refund/stock reconciliation are still required before production use. The current dependency lockfiles also have outstanding npm audit advisories (21 in the frontend tree and 15 in the backend tree at the latest audit); Dependabot is configured to open weekly npm update pull requests, but those advisories are not yet confirmed fixed. Inventory restoration currently uses multiple database updates rather than a multi-document transaction; monitor and reconcile exceptional failures.

## Vercel-specific notes

- Vercel Functions are request-driven; do not rely on `setInterval`, in-memory queues or a permanently running process for critical background work. The local server's interval is intentionally not used by the Vercel app entrypoint.
- Vercel Functions do not provide a WebSocket server. The current rider tracking uses periodic HTTP requests, which remains compatible; do not plan Socket.IO hosting inside this function.
- Browser authentication uses credentialed cookies. Keep both projects on HTTPS, set the exact frontend origin in the backend CORS environment, and ensure the frontend API client sends credentials.
- Deploy the backend first, copy its deployment origin into the frontend's `VITE_API_BASE_URL`, set the backend's `FRONTEND_URL` to the frontend deployment origin, then redeploy both projects if either value changes.
