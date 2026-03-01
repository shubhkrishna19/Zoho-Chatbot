# PROJECT IDENTITY — ZohoChatbot (BlueBot)

> **🔒 This file is locked. Do not modify without Shubh's explicit approval.**
> Last updated: 2026-02-28 | Owner: Shubh Krishna / Bluewud Industries

---

## What This Project Is

**BlueBot** is Bluewud's AI-powered customer support chatbot, live in production.

- Customer-facing: embedded on bluewud.com via Zoho SalesIQ widget
- Also accessible directly at: https://bluewud-chatbot.vercel.app
- Handles: product queries, order tracking, shipping/returns FAQs, handoff to human support

---

## Deployment Target

| Layer | Technology | Details |
|---|---|---|
| Hosting | **Vercel** | `bluewud-chatbot.vercel.app` |
| Runtime | **Node.js** (Vercel Serverless Functions) | api/ folder auto-detected by Vercel |
| AI Engine | **Google Gemini 2.0 Flash** | via REST API (`gemini-2.0-flash`) |
| Widget | **Zoho SalesIQ** | custom widget posts to `/api/zoho` |
| Direct API | Custom POST `/api/message` | for custom chat-widget.js |

Deploy command: `vercel --prod` (from project root)

---

## Approved Tech Stack

| Component | Approved | NOT Allowed |
|---|---|---|
| Runtime | Node.js | Python, Deno |
| AI | Google Gemini Flash | OpenAI, Anthropic direct, MiniMax |
| Framework | Vercel Serverless Functions | Express server, Nest.js, tRPC |
| Data | JSON files (database.json, products.json) | PostgreSQL, MongoDB, Redis |
| Auth | None (public chatbot) | JWT, sessions |

---

## Folder Structure

```
api/
  brain.js          — AI core: RAG search + Gemini call
  message.js        — /api/message endpoint (custom widget)
  zoho.js           — /api/zoho endpoint (Zoho SalesIQ webhook)
  orders.js         — /api/orders endpoint (order tracking)
  data/
    database.json   — 12 FAQ categories, 60+ Q&As
    products.json   — 295 products with dimensions/prices
    product_names.json — SKU → human-readable name mappings

public/
  chat-widget.js    — custom 493-line chat widget UI
  test.html         — test page for the widget

vercel.json         — Vercel routing config
.env.example        — documents required env vars
```

---

## Environment Variables (set in Vercel dashboard)

| Variable | Purpose | Where to rotate |
|---|---|---|
| `GOOGLE_API_KEY` | Gemini AI API access | console.cloud.google.com |
| `DEBUG_LOGGING` | Set `true` to log payloads locally | Set in `.env` only, never Vercel prod |

---

## Data Update Rules

- **FAQ updates** → edit `api/data/database.json` — follow existing schema exactly
- **Product updates** → edit `api/data/products.json` — never delete the `sku` field
- **Product name mappings** → edit `api/data/product_names.json`
- **Offer codes** → update the "Offers & Discounts" category in `database.json`
- Raw CSV exports go in `.gitignore` — NOT in the repo

---

## Untouchable Files (do not modify without asking Shubh)

- `vercel.json` — breaks routing if changed
- `api/data/products.json` structure — 295 products; bulk changes via script only
- `GOOGLE_API_KEY` — must rotate in Vercel dashboard AND in `.env` locally
- This file (`PROJECT_IDENTITY.md`)

---

## Business Context

- Company: Bluewud Concepts Pvt. Ltd.
- Support: care@bluewud.com | +91 88006 09609 (9AM–6PM IST)
- Website: bluewud.com
- Products: Contemporary flat-pack furniture for Indian homes
