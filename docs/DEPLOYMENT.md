# Production deployment guide

This repository is a monorepo with a Vite frontend in `client/` and an Express API in `server/`. Deploy them as separate services so the frontend can be served from a CDN and the API can keep its own environment secrets.

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

## 3. Frontend (Vercel example)

Create a Vercel project from the same repository:

- Root directory: `client`
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

Set the build environment variable:

- `VITE_API_BASE_URL`: the deployed backend origin, e.g. `https://your-api-service.onrender.com` (no trailing slash)

Redeploy the frontend after setting or changing this variable. Vite embeds `VITE_*` values into the browser bundle; never put private keys or secrets in frontend environment variables.

If using a different static host, configure SPA fallback so application routes such as `/orders`, `/profile` and `/admin` serve `index.html`.

## 4. CORS, cookies and custom domains

1. Set `FRONTEND_URL` to the exact deployed frontend origin, including `https://` and excluding a trailing slash.
2. Add any additional frontend/admin origins to `FRONTEND_URLS`, comma-separated.
3. The production API rejects browser origins that are not in this allowlist.
4. Keep frontend and API on HTTPS. Authentication cookies use `Secure` and `SameSite=None` in production.
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

- Open `https://YOUR-BACKEND-DOMAIN/healthz`; confirm HTTP 200 and database connected.
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

A green CI build is not proof of a successful live deployment. Browser-based customer-to-delivery testing, Razorpay sandbox end-to-end testing, webhook monitoring and operational refund/stock reconciliation are still required before production use. Inventory restoration currently uses multiple database updates rather than a multi-document transaction; monitor and reconcile exceptional failures.
