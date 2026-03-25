# BlueBot Chatbot Walkthrough

## Setup

```bash
git clone https://github.com/shubhkrishna19/Zoho-Chatbot.git
cd Zoho-Chatbot
npm install
```

Create `.env` for local testing:

```env
MINIMAX_API_KEY=your_minimax_api_key_here
ORDER_HUB_BASE_URL=https://orderhub.development.catalystappsail.com
```

## Local Checks

```bash
node --check api/brain.js
node --test --test-isolation=none tests/brain.test.js
node test_local.js
```

## Deploy Handoff

Use `docs/vercel_deploy_readiness.md` for the exact Vercel env list and post-deploy smoke tests.
