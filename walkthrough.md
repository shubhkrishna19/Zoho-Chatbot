# Bluebot Chatbot - Final Walkthrough

## ✅ Current Status: LIVE & SYNCED

| Component | URL |
|-----------|-----|
| **Live Chatbot** | https://bluewud-chatbot.vercel.app |
| **Test Page** | https://bluewud-chatbot.vercel.app/test.html |
| **Zoho Webhook** | https://bluewud-chatbot.vercel.app/api/zoho |
| **GitHub Repo** | https://github.com/shubhkrishna19/Zoho-Chatbot |

---

## 🚀 For Your Collaborator - Complete Setup Guide

### Step 1: Clone & Install
```bash
git clone https://github.com/shubhkrishna19/Zoho-Chatbot.git
cd Zoho-Chatbot
npm install
```

### Step 2: Create Environment File
Create a file named `.env` with:
```
GOOGLE_API_KEY=your_api_key_here
```

### Step 3: Install Vercel CLI
```bash
npm install -g vercel
vercel login
vercel link --project bluewud-chatbot
```

---

## 📝 Daily Workflow for Both Developers

```bash
# 1. Always start by pulling latest
git pull origin main

# 2. Make your edits to the code...

# 3. Stage, commit, and push
git add .
git commit -m "Description of changes"
git push origin main

# 4. Deploy to production
vercel --prod
```

---

## 📂 Key Files

| File | What It Controls |
|------|------------------|
| `api/knowledge.js` | FAQ database |
| `api/brain.js` | AI logic & intents |
| `api/zoho.js` | Zoho webhook |
| `public/chat-widget.js` | Custom widget UI |

---

## ⚠️ Important Notes

1. **Never commit `.env`** - Contains secret API keys
2. **Always `git pull` first** - Prevents conflicts
3. **Run `vercel --prod` after pushing** - Makes changes live
4. **Git email must match Vercel** - Use `shubhkrishna.19@gmail.com`
