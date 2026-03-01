# Bluebot Chatbot - Development Workflow

## 🔗 Quick Links
- **GitHub:** https://github.com/shubhkrishna19/Zoho-Chatbot
- **Live Site:** https://bluewud-chatbot.vercel.app
- **Test Page:** https://bluewud-chatbot.vercel.app/test.html

---

## 🚀 First-Time Setup (Collaborator)

```bash
git clone https://github.com/shubhkrishna19/Zoho-Chatbot.git
cd Zoho-Chatbot
npm install

# Create .env with API key
echo GOOGLE_API_KEY=your_key > .env

# Setup Vercel
npm install -g vercel
vercel login
vercel link --project bluewud-chatbot
```

---

## 📝 Daily Workflow (Both Developers)

```bash
# 1. ALWAYS pull latest first
git pull origin main

# 2. Make your changes...

# 3. Push to GitHub
git add .
git commit -m "Description"
git push origin main

# 4. Deploy and test on LIVE site
vercel --prod

# 5. Test at: https://bluewud-chatbot.vercel.app/test.html
```

---

## 📂 Key Files

| File | Purpose |
|------|---------|
| `api/knowledge.js` | FAQ Database |
| `api/brain.js` | AI Logic |
| `api/zoho.js` | Zoho Webhook |
| `public/chat-widget.js` | Widget UI |

---

## ⚠️ Rules

1. **Always `git pull` first** - Get teammate's changes
2. **Never commit `.env`** - Secret keys
3. **Test after deploying** - Verify on live site
