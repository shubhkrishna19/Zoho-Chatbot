# BlueBot Chatbot

BlueBot is Bluewud's live Vercel-hosted support chatbot for product help, FAQ and policy answers, and order tracking.

## Current Runtime

- AI provider: MiniMax M2.5
- Product/context source: Zoho-backed catalog and FAQ data in repo
- Order tracking source: OrderHub via `api/orders.js`
- Live URL: https://bluewud-chatbot.vercel.app
- Test page: https://bluewud-chatbot.vercel.app/test.html

## Required Vercel Env Vars

- `MINIMAX_API_KEY`

Optional:

- `ORDER_HUB_BASE_URL` (set this later when live OrderHub-backed order tracking is ready)
- `MINIMAX_MODEL`
- `MINIMAX_BASE_URL`
- `DEBUG_LOGGING`

See `docs/vercel_deploy_readiness.md` for the exact deploy handoff and smoke tests.

## Local Verification

```bash
node --check api/brain.js
node --test --test-isolation=none tests/brain.test.js
node test_local.js
```

## Key Files

- `api/brain.js` - MiniMax integration and deterministic reply logic
- `api/message.js` - request validation
- `api/orders.js` - OrderHub order-status lookup
- `public/chat-widget.js` - storefront widget
- `.env.example` - env reference
- `docs/vercel_deploy_readiness.md` - deploy, env, and smoke-test checklist

## Deploy Note

Do not deploy from an AI lane unless Shubh explicitly asks for it.
