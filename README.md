# 🤖 Bluewud AI Chatbot

> **⚠️ AI ASSISTANT: READ THIS ENTIRE FILE BEFORE STARTING ANY WORK**

---

## 📋 PROJECT STATUS

| Item | Status |
|------|--------|
| **Live URL** | https://bluewud-chatbot.vercel.app |
| **Zoho Webhook** | https://bluewud-chatbot.vercel.app/api/zoho |
| **Last Deploy** | Dec 5, 2025 |
| **Current Sprint** | Initial Release ✅ |

---

## 🎯 PRODUCTION GOALS

- [x] Custom widget UI with modern design
- [x] Gemini AI integration with 200+ FAQs
- [x] Zoho SalesIQ native webhook integration
- [x] Human handoff via Support button
- [ ] Add product catalog search
- [ ] Add order tracking integration
- [ ] Improve response accuracy

---

## 📝 CHANGE LOG (Update Before Pushing!)

| Date | Developer | Changes Made | Tested? |
|------|-----------|--------------|---------|
| Dec 5 | Shubh | Initial setup, Zoho integration | ✅ |
| Feb 9 | AI | Added Gemini timeout/retry, debug logging flag, fuzzy product search | ⚠️ Not run |
| Feb 10 | AI | Documented how to publish changes to GitHub/Vercel | ⚠️ Not run |
| | | | |

---

## 🚨 MANDATORY RULES FOR AI ASSISTANTS

1. **ALWAYS read this README first** before making any changes
2. **ALWAYS run `git pull origin main`** before starting work
3. **NEVER modify `.env`** - contains secret API keys
4. **ALWAYS update the CHANGE LOG** above with your changes
5. **ALWAYS test on live site** after deploying
6. **ALWAYS commit and push after EVERY change session**
7. **COORDINATE with the other developer** - check Change Log

---

## 🔄 HOW GIT SYNC WORKS (IMPORTANT!)

### Both Developers Can Work for Days Independently!

Git automatically **merges your changes together** when you both push:

```
Developer 1: Edits brain.js for 3 days
Developer 2: Edits knowledge.js for 3 days
                    ↓
        Both push to GitHub
                    ↓
   Git MERGES both changes automatically!
```

### The Golden Rule: Pull → Work → Commit → Pull → Push

```bash
# 1. START of your work session
git pull origin main

# 2. Make your changes (can work for hours/days)

# 3. BEFORE pushing, pull again to get teammate's changes
git add .
git commit -m "Your changes description"
git pull origin main    # <-- This auto-merges their changes with yours!

# 4. Push your merged changes
git push origin main

# 5. Deploy
vercel --prod
```

### If You Both Edit the SAME Lines (Rare)

Git will pause and show you both versions:
```
<<<<<<< HEAD
Your code
=======
Their code
>>>>>>> origin/main
```
Pick which to keep, save, then:
```bash
git add .
git commit -m "Resolved merge"
git push origin main
```

---

## 📂 FILE STRUCTURE

```
├── api/
│   ├── brain.js        # AI logic, intents, Gemini prompt
│   ├── knowledge.js    # FAQ database (200+ Q&As)
│   ├── message.js      # API endpoint for custom widget
│   └── zoho.js         # Webhook adapter for Zoho SalesIQ
├── public/
│   ├── chat-widget.js  # Custom widget UI
│   └── test.html       # Test page
├── .env                # API keys (DO NOT COMMIT!)
└── README.md           # THIS FILE - Read first!
```

---

## 🔧 KEY FILES TO EDIT

| To Change... | Edit This File |
|--------------|----------------|
| AI responses/prompt | `api/brain.js` |
| FAQ answers | `api/knowledge.js` |
| Widget appearance | `public/chat-widget.js` |
| Zoho behavior | `api/zoho.js` |

---

## 🚀 QUICK COMMANDS

```bash
# Sync with teammate (do this often!)
git pull origin main

# Save your work
git add .
git commit -m "Description"
git push origin main

# Deploy live
vercel --prod

# Check status
git status
```

---

## 🛫 HOW TO PUBLISH CHANGES TO GITHUB & VERCEL

Follow this checklist any time you need to ship updates:

1) **Add the GitHub remote** (only once per machine):
```bash
git remote add origin https://github.com/shubhkrishna19/Zoho-Chatbot.git
```

2) **Sync the latest code** before you start working:
```bash
git pull origin main
```

3) **Stage and commit** your changes locally:
```bash
git add .
git commit -m "Describe your change"
```

4) **Pull again** to merge any teammate updates, resolve conflicts if shown, then **push** to GitHub:
```bash
git pull origin main
git push origin main
```

5) **Deploy to production on Vercel** using the same commit that is now on GitHub:
```bash
vercel --prod
```

6) **Verify live**:
- Chat widget: https://bluewud-chatbot.vercel.app/test.html
- Zoho webhook: https://bluewud-chatbot.vercel.app/api/zoho
- Confirm Zoho SalesIQ shows the new behavior.

---

## 👥 TEAM COORDINATION CHECKLIST

**Before starting work:**
- [ ] Read this README
- [ ] Run `git pull origin main`
- [ ] Check CHANGE LOG for recent updates

**After finishing work:**
- [ ] Update CHANGE LOG above
- [ ] Run: `git add . && git commit -m "message"`
- [ ] Run: `git pull origin main` (merges teammate's work)
- [ ] Run: `git push origin main`
- [ ] Run: `vercel --prod`
- [ ] Test at: https://bluewud-chatbot.vercel.app/test.html

---

## 🔗 RESOURCES

- **GitHub:** https://github.com/shubhkrishna19/Zoho-Chatbot
- **Vercel:** https://vercel.com/shubh-krishna-singhs-projects/bluewud-chatbot
- **Test Page:** https://bluewud-chatbot.vercel.app/test.html
