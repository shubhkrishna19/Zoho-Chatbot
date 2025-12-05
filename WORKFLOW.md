# Bluewud Chatbot - Development & Deployment Workflow

## 🔗 Quick Links
- **GitHub Repo:** https://github.com/shubhkrishna19/Zoho-Chatbot
- **Live Site:** https://bluewud-chatbot.vercel.app
- **Test Page:** https://bluewud-chatbot.vercel.app/test.html
- **Zoho Webhook:** https://bluewud-chatbot.vercel.app/api/zoho

---

## 🚀 First-Time Setup (For New Collaborator)

```bash
# 1. Clone the repository
git clone https://github.com/shubhkrishna19/Zoho-Chatbot.git
cd Zoho-Chatbot

# 2. Install dependencies
npm install

# 3. Create .env file (get API key from team lead)
echo GOOGLE_API_KEY=your_key_here > .env

# 4. Install Vercel CLI globally
npm install -g vercel

# 5. Login to Vercel (one-time)
vercel login
```

---

## 📝 Daily Development Workflow

### Before Starting Work
```bash
# Always pull latest changes first!
git pull origin main
```

### After Making Changes
```bash
# 1. Stage your changes
git add .

# 2. Commit with a descriptive message
git commit -m "Added new FAQ about returns"

# 3. Push to GitHub
git push origin main

# 4. Deploy to Vercel (makes it LIVE!)
vercel --prod
```

---

## 📂 Key Files to Edit

| File | Purpose | When to Edit |
|------|---------|--------------|
| `api/knowledge.js` | FAQ Database | Add/update product info, policies |
| `api/brain.js` | AI Logic & Intents | Change keywords, modify AI prompt |
| `api/zoho.js` | Zoho Webhook | Modify native Zoho bot behavior |
| `public/chat-widget.js` | Custom Widget UI | Change colors, layout, styling |
| `ChatbotDatabaseQuestions.txt` | Reference FAQs | Source document for knowledge |

---

## ⚡ Quick Command Cheatsheet

```bash
# Check what files changed
git status

# See difference in files
git diff

# Undo uncommitted changes
git checkout -- filename.js

# Pull + push in one go
git pull && git add . && git commit -m "message" && git push

# Deploy to production
vercel --prod
```

---

## ⚠️ Important Rules

1. **Always `git pull` before starting work** - Prevents merge conflicts
2. **Never commit `.env` file** - Contains secret API keys
3. **Test locally before deploying** - Run `vercel dev` or `npm start`
4. **Use descriptive commit messages** - Helps track changes
5. **Deploy after every push** - Run `vercel --prod` to make changes live

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Merge conflict | Run `git pull`, resolve conflicts, commit again |
| Vercel not deploying | Check `vercel logs` for errors |
| API key not working | Verify `.env` file exists and has correct key |
| Changes not showing | Clear browser cache or wait 30 seconds |
