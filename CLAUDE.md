# CLAUDE.md — ZohoChatbot / BlueBot (Claude Code Extension)
# This file extends AGENTS.md with Claude Code-specific context.
# READ AGENTS.md FIRST — all architecture, rules, and project identity live there.

---

## Claude Code Notes

- **Vercel serverless**: each file in `api/` is a separate serverless function. No shared state between requests.
- **Node.js only**: no build step, no TypeScript. Plain CommonJS or ESM (`require` vs `import` — check existing files).
- **Gemini SDK**: uses `@google/generative-ai` npm package. Check package.json version before adding new Gemini features.
- **Testing locally**: `vercel dev` spins up a local Vercel runtime. Much better than raw `node api/brain.js`.
- **System prompt location**: `api/brain.js` → the `systemInstruction` object. Keep under 200 words.

## Useful Claude Code Commands for This Project

```bash
# Run locally
vercel dev

# Check Gemini SDK version
cat package.json | grep generative-ai

# Test brain endpoint
curl -X POST http://localhost:3000/api/brain \
  -H "Content-Type: application/json" \
  -d '{"message": "What sofas do you sell?"}'
```

## What to Read Before Touching Code

1. `AGENTS.md` — project rules, product data flow, system prompt constraints
2. `PROJECT_IDENTITY.md` — locked identity
3. `api/brain.js` — Gemini integration + system prompt
4. `api/message.js` — validation (500 char limit)
5. `api/zoho.js` — Zoho product context builder
