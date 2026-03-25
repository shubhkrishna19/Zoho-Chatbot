# PROJECT IDENTITY - ZohoChatbot (BlueBot)

> Locked identity context updated on 2026-03-18 to match the current MiniMax and OrderHub runtime.

## What This Project Is

BlueBot is Bluewud's live customer support chatbot.

- Customer-facing storefront widget on bluewud.com
- Also accessible directly at https://bluewud-chatbot.vercel.app
- Handles product questions, FAQ and policy answers, order tracking, and human handoff

## Deployment Target

| Layer | Technology | Details |
|---|---|---|
| Hosting | Vercel | `bluewud-chatbot.vercel.app` |
| Runtime | Node.js serverless functions | `api/` routes |
| AI Engine | MiniMax M2.5 | OpenAI-compatible REST endpoint |
| Widget | Zoho SalesIQ plus custom widget | storefront plus test page |
| Order tracking | OrderHub | `api/orders.js` |

## Approved Tech Stack

| Component | Approved | Not approved |
|---|---|---|
| Runtime | Node.js on Vercel | Python, Deno |
| AI | MiniMax M2.5 | direct provider swaps without approval |
| Data | JSON files plus Zoho context plus OrderHub | PostgreSQL, MongoDB, Redis |
| Auth | Public chatbot, env-based upstream keys | sessions, JWT |

## Important Files

- `api/brain.js` - AI core and deterministic flow routing
- `api/message.js` - custom widget endpoint
- `api/orders.js` - order tracking endpoint
- `api/zoho.js` - Zoho and SalesIQ context builder
- `public/chat-widget.js` - storefront widget
- `.env.example` - env reference
- `docs/vercel_deploy_readiness.md` - Vercel env list and smoke tests

## Environment Variables

Required in Vercel:

- `MINIMAX_API_KEY`
- `ORDER_HUB_BASE_URL`

Optional:

- `MINIMAX_MODEL`
- `MINIMAX_BASE_URL`
- `DEBUG_LOGGING`

## Untouchable Without Approval

- `vercel.json`
- `api/data/products.json` structure
- real env secrets
