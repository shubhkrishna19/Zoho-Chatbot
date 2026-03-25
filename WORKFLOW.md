# BlueBot Chatbot Workflow

## Required Vercel Env Vars

- `MINIMAX_API_KEY`
- `ORDER_HUB_BASE_URL`

## Local Workflow

```bash
npm install
node --check api/brain.js
node --test --test-isolation=none tests/brain.test.js
node test_local.js
```

## Deploy Review Workflow

1. Confirm Vercel env vars are set.
2. Review `docs/vercel_deploy_readiness.md`.
3. Deploy only when Shubh explicitly approves it.
4. Run the post-deploy smoke tests immediately after deploy.
