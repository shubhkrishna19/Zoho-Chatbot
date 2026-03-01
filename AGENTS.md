# AGENTS.md — ZohoChatbot (BlueBot)
# Universal AI context file. Read this first, regardless of which AI tool you are.
# Works with: Claude Code, MiniMax, Antigravity, OpenClaw, Codex, Cursor, Copilot

---

## Project Identity

- **Name:** ZohoChatbot (internally: BlueBot)
- **Owner:** Shubh (Bluewud)
- **Platform:** Vercel (serverless Node.js API routes)
- **Status:** Live / Production
- **Purpose:** AI-powered customer support chatbot for Bluewud's Shopify store. Answers product questions, shipping queries, return policies. Embedded in the storefront.

---

## Tech Stack

| Layer         | Tech                                             |
|---------------|--------------------------------------------------|
| Runtime       | Node.js (Vercel serverless functions)            |
| AI Model      | Google Gemini 2.0 Flash (`gemini-2.0-flash`)    |
| Product data  | Zoho Inventory / Zoho CRM API (`api/zoho.js`)   |
| Deployment    | Vercel (`vercel --prod`)                         |
| Auth          | Google API key (env var only — never in code)   |

---

## Critical Rules — Any AI Must Follow

1. **Model is `gemini-2.0-flash`** — do not downgrade or change without Shubh's approval.
2. **`maxOutputTokens: 400`** — keep it. Responses must be concise for a chat widget.
3. **System prompt is in `api/brain.js`** — the 3-4 sentence max rule is intentional.
4. **Never expose raw API errors to users** — `api/zoho.js` catch blocks must return generic messages.
5. **Message length limit is 500 chars** — enforced in `api/message.js`. Do not remove.
6. **No credentials in code** — `GOOGLE_API_KEY` lives in Vercel environment variables.
7. **Never call `vercel --prod`** — Shubh deploys.

---

## File Structure (important files)

```
api/
  brain.js          ← Gemini AI integration, system prompt, model config
  message.js        ← Message validation (500 char limit, type check)
  zoho.js           ← Zoho CRM/Inventory API caller, product context builder
  health.js         ← Health check endpoint
.env.example        ← GOOGLE_API_KEY placeholder
PROJECT_IDENTITY.md ← locked identity
```

---

## System Prompt Design (brain.js)

The system prompt:
- Identifies the bot as "BlueBot" for Bluewud
- Sets 3-4 sentence max per response
- Instructs: answer only Bluewud-related questions, no hallucination, use product data from Zoho context
- Format: plain text, no markdown in responses (chat widget doesn't render it)

When editing the system prompt: keep it under 200 words, maintain the no-hallucination rule, and keep the 3-4 sentence constraint.

---

## Product Data Flow

```
User asks → api/message.js (validates) → api/brain.js (builds Gemini request)
              ↓
          api/zoho.js fetches relevant products from Zoho
              ↓
          Gemini 2.0 Flash answers with product context
              ↓
          Response returned (max 400 tokens)
```

---

## When Working on This Project

- Test with real customer questions: "What are the dimensions of X?", "Do you ship to Bangalore?", "What's your return policy?"
- Check that error messages shown to users are generic (not raw API errors)
- Do not add markdown formatting to responses — the Shopify chat widget renders plain text

---

## Handoff Protocol

When done: summarize changes, list modified files, flag TODOs. Do not deploy.


## Session Start Checklist

Every session, before writing any code:
1. Read this AGENTS.md fully
2. Read TASKS.md — check what's IN PROGRESS (don't duplicate work)
3. Claim your task in TASKS.md before starting
4. Work on a branch: feat/[agent-tag]-T[id]-[slug]
5. Full protocol: BluewudOrchestrator/COORDINATION.md
