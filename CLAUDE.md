# CLAUDE.md - ZohoChatbot / BlueBot
# Claude Code-specific notes. Read AGENTS.md first.

## Claude Code Notes

- Vercel serverless: every file in `api/` is its own function.
- Node.js only: no TypeScript or build step.
- `api/brain.js` calls the MiniMax OpenAI-compatible REST endpoint with `node-fetch`.
- `buildAiSystemPrompt()` is the system prompt builder.
- Deterministic category, product, FAQ, and order-tracking flows should remain local and stable.

## Useful Local Commands

```bash
# Run locally with Vercel
vercel dev

# Syntax-check the chatbot brain
node --check api/brain.js

# Run local verification
node --test --test-isolation=none tests/brain.test.js
node test_local.js

# Hit the public message endpoint locally
curl -X POST http://localhost:3000/api/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me TV Units"}'
```

## Read Before Editing

1. `AGENTS.md`
2. `PROJECT_IDENTITY.md`
3. `api/brain.js`
4. `api/message.js`
5. `api/orders.js`
6. `docs/vercel_deploy_readiness.md`
