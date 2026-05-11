# Penguin 3D Server

Private Express and TypeScript API for the Penguin 3D jewelry model storefront.
It owns auth, catalog data, media uploads, subscriptions, acquisitions,
collections, customer account data, admin workflows, and generated API docs.

## Environment

Copy `.env.example` to `.env` and configure:

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`
- `RESEND_API_KEY`, `MAIL_FROM`
- `CLIENT_URL`, `CORS_ORIGINS`
- `LEMON_SQUEEZY_API_KEY`, `LEMON_SQUEEZY_STORE_ID`, `LEMON_SQUEEZY_VARIANT_ID`, `LEMON_SQUEEZY_WEBHOOK_SECRET`

## Commands

```bash
yarn install
yarn dev
yarn build
yarn start
yarn lint
yarn format
yarn test
```

`yarn dev` starts Nodemon with TypeScript. Default local URLs:

- API: `http://localhost:7777/api/v1`
- Docs: `http://localhost:7777/docs`
- OpenAPI: `http://localhost:7777/openapi.json`
- Health: `http://localhost:7777/api/v1/health`

## Operational Notes

- API prefix defaults to `/api/v1`.
- Runtime docs are served by Scalar at `/docs`.
- OpenAPI JSON is generated from `src/docs`.
- GitHub Actions run lint, tests, build, and Heroku deployment.
- `penguin-client` consumes this API through `NEXT_PUBLIC_API_URL`.
- Server responses are the source of truth for catalog, access, subscription, and download state.

## License

Proprietary Penguin 3D software. See `LICENSE`.
