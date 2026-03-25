# Vercel Deploy Readiness

This is the current deploy handoff for BlueBot on Vercel.

## Required Vercel Env Vars

- `MINIMAX_API_KEY`
  - Purpose: live chatbot responses through MiniMax M2.5

## Optional Vercel Env Vars

- `ORDER_HUB_BASE_URL`
  - Purpose: enables live OrderHub-backed order-status lookups in `api/orders.js`
  - Value format: full base URL with no trailing slash
  - If omitted, the chatbot stays live for product/policy support and order tracking falls back to a support-directed "being enabled" message instead of fake statuses

- `MINIMAX_MODEL`
  - Default: `MiniMax-M2.5`
- `MINIMAX_BASE_URL`
  - Default: `https://api.minimax.io/v1`
- `DEBUG_LOGGING`
  - Default: `false`

## Post-Deploy Smoke Tests

1. Open `https://bluewud-chatbot.vercel.app/test.html` and send `Show me TV Units`.
   Expected: collection link reply, no raw errors.
2. Send `Return policy`.
   Expected: FAQ or policy answer without MiniMax reasoning text.
3. Send `Track my order`.
   Expected: order-tracking instructions asking for Order ID and phone or email verification.
4. Call `POST /api/orders` with one known-safe order and matching phone or email.
   Expected:
   - with `ORDER_HUB_BASE_URL` configured: `200` plus either `found: true` with a status or a verification guidance response
   - without `ORDER_HUB_BASE_URL`: `200`, `source: "disabled"`, and a support-directed message instead of mock tracking data
5. Confirm the widget still opens, quick chips still render, and support handoff still points to Bluewud support.

## Local Validation Before Deploy Review

```bash
node --check api/brain.js
node --test --test-isolation=none tests/brain.test.js
node test_local.js
```
