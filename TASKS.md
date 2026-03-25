# Tasks - Zoho Chatbot (BlueBot)

## Protocol
Before claiming a task: read AGENTS.md + COORDINATION.md (in BluewudOrchestrator/).
Claim a task by moving it to IN PROGRESS with your agent tag [CLAUDE]/[CODEX-XX]/[MINIMAX]/[OPENCLAW].
Always work on a branch: feat/[agent]-T[id]-[slug]. Never commit directly to main.

## PENDING
- [ ] [T-001] Add conversation memory - carry context across multi-turn Q&A (Priority: HIGH)
- [ ] [T-002] Add product image URLs to product data responses (Priority: MED)
- [ ] [T-003] Add fallback response when Gemini API is unavailable (Priority: HIGH)
- [ ] [T-004] Implement rate limiting per user session to prevent API abuse (Priority: MED)
- [ ] [T-005] Add admin endpoint to refresh product data without redeploying (Priority: LOW)

## IN PROGRESS
(none)

## DONE
- [x] [T-006] Replace Gemini provider wiring with MiniMax M2.5 while preserving product, FAQ, and order-tracking flows - completed by [CODEX-01] on 2026-03-18
  - Branch: codex/session-c-chatbot-minimax-hotfix
  - Live notes: deployed to Vercel production, smoke-tested category browse, general live reply, and support-directed order tracking fallback
