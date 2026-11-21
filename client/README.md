# PrimeCommerce storefront

React 19 + Vite 7 customer storefront for the PrimeCommerce quick-commerce application.

## Local development

1. Install dependencies: `npm ci`
2. Start the Express API from the repository's `server/` directory on port `5000`.
3. Start the storefront: `npm run dev` (Vite proxies `/api` requests to `http://localhost:5000`).

For a deployed API, set `VITE_API_BASE_URL` to its HTTPS origin before building. Leave it empty for local development. Never put private API keys or secrets in a `VITE_*` variable.

## Quality checks

- `npm run lint`
- `npm run build`
