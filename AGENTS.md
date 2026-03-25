# AGENTS.md - ZohoChatbot (BlueBot)
# Universal project context for Codex, Claude, MiniMax, OpenClaw, Cursor, and Copilot.

## Project Identity

- Name: ZohoChatbot (BlueBot)
- Owner: Shubh (Bluewud)
- Platform: Vercel serverless Node.js API routes
- Status: Live / production
- Purpose: Customer-facing Bluewud support chatbot for product help, policy guidance, and order tracking

## Tech Stack

| Layer | Tech |
|---|---|
| Runtime | Node.js on Vercel serverless functions |
| AI Model | MiniMax M2.5 (`MiniMax-M2.5`) |
| Product data | Zoho Inventory / Zoho CRM context via `api/zoho.js` |
| Order tracking | OrderHub lookup via `api/orders.js` |
| Deployment | Vercel |

## Critical Rules

1. Keep the storefront AI on `MiniMax-M2.5` unless Shubh explicitly changes providers.
2. Keep `max_tokens` at `400` so replies stay chat-widget sized.
3. Keep the system prompt in `api/brain.js` concise, grounded, and plain text only.
4. Never expose raw upstream errors to users.
5. Keep the `500` character message limit in `api/message.js`.
6. Never commit credentials. Vercel runtime env vars are the source of truth.
7. Do not deploy from an AI lane unless Shubh explicitly instructs it.

## Runtime Env Vars

Required for live Vercel deploys:

- `MINIMAX_API_KEY`
- `ORDER_HUB_BASE_URL`

Optional:

- `MINIMAX_MODEL` (defaults to `MiniMax-M2.5`)
- `MINIMAX_BASE_URL` (defaults to `https://api.minimax.io/v1`)
- `DEBUG_LOGGING`

## Important Files

- `api/brain.js` -> MiniMax wiring, deterministic product/category/policy flow, system prompt
- `api/message.js` -> request validation and message length guard
- `api/orders.js` -> OrderHub-backed order tracking endpoint
- `api/zoho.js` -> product context builder
- `.env.example` -> local/Vercel env reference
- `docs/vercel_deploy_readiness.md` -> deploy env list and post-deploy smoke tests
- `PROJECT_IDENTITY.md` -> locked project identity and approved stack

## Request Flow

User message -> `api/message.js` validation -> `api/brain.js`

Deterministic flows stay local first:

- category browse
- product/spec lookup
- FAQ/policy answers
- order tracking prompt

Only unresolved chat requests go to MiniMax with catalog and FAQ context.

## Session Start Checklist

1. Read this file.
2. Read `TASKS.md` and avoid duplicate work.
3. Follow `BluewudOrchestrator/COORDINATION.md`.
4. Do not deploy unless explicitly told to.
