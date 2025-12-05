const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// ============================================
// LOAD DATABASE FROM JSON FILE
// ============================================
let database = null;

function loadDatabase() {
    try {
        const dbPath = path.join(__dirname, '..', 'data', 'database.json');
        const data = fs.readFileSync(dbPath, 'utf8');
        database = JSON.parse(data);
        console.log(`✅ Database loaded: ${database.categories.length} categories`);
        return true;
    } catch (error) {
        console.error('❌ Failed to load database:', error.message);
        database = null;
        return false;
    }
}

// Load on startup
loadDatabase();

// ============================================
// GET CONFIG & MESSAGES FROM DATABASE
// ============================================
function getConfig() {
    return database?.config || {
        botName: "Bluewud Furniture Expert",
        contact: {
            phone: "8800609609",
            whatsapp: "+918800609609",
            email: "care@bluewud.com",
            hours: "09:00 AM - 06:00 PM (Mon-Sat)"
        }
    };
}

function getMessage(key) {
    const defaults = {
        welcome: "Welcome to Bluewud! 👋 How can I help you today?",
        error: "I'm having trouble right now. Please contact us at +918800609609 or care@bluewud.com",
        handoff: "📞 Phone/WhatsApp: +918800609609\n📧 Email: care@bluewud.com\n⏰ Hours: 09:00 AM - 06:00 PM (Mon-Sat)",
        goodbye: "Thank you for contacting us! Have a great day! 👋"
    };
    return database?.messages?.[key] || defaults[key] || '';
}

// ============================================
// SEARCH FAQS BY KEYWORDS
// ============================================
function searchFaqs(query) {
    if (!database || !database.categories) return null;

    const queryLower = query.toLowerCase();
    const words = queryLower.split(/\s+/);

    let bestMatch = null;
    let bestScore = 0;

    for (const category of database.categories) {
        for (const faq of category.faqs || []) {
            let score = 0;

            // Check keywords
            for (const keyword of faq.keywords || []) {
                if (queryLower.includes(keyword.toLowerCase())) {
                    score += 10;
                }
            }

            // Check question text
            const qLower = (faq.q || '').toLowerCase();
            for (const word of words) {
                if (word.length > 2 && qLower.includes(word)) {
                    score += 5;
                }
            }

            if (score > bestScore) {
                bestScore = score;
                bestMatch = { ...faq, category: category.name, icon: category.icon };
            }
        }
    }

    return bestScore >= 10 ? bestMatch : null;
}

// ============================================
// INTENT PATTERNS FOR QUICK RESPONSES
// ============================================
const intents = [
    {
        patterns: [/^hi$/i, /^hello$/i, /^hey$/i, /^hii+$/i, /good\s*(morning|afternoon|evening)/i],
        reply: "Hi there! 👋 How can I help you with your furniture needs today?",
        category: "greeting"
    },
    {
        patterns: [/^bye$/i, /^goodbye$/i, /thank.*bye/i, /^ok\s*bye/i],
        reply: "Thank you for contacting us! Have a great day! 👋",
        category: "farewell"
    },
    {
        patterns: [/^thanks?$/i, /^thank\s*you$/i, /^thx$/i],
        reply: "You're welcome! 😊 Is there anything else I can help you with?",
        category: "gratitude"
    },
    {
        patterns: [/talk\s*to\s*(human|agent|person)/i, /customer\s*(care|service|support)/i, /contact/i, /phone/i, /call/i],
        reply: "📞 Phone/WhatsApp: +918800609609\n📧 Email: care@bluewud.com\n⏰ Hours: 09:00 AM - 06:00 PM (Mon-Sat)",
        category: "handoff",
        action: "handoff"
    }
];

function findIntent(message) {
    const cleanMsg = message.trim().toLowerCase();

    for (const intent of intents) {
        if (intent.patterns.some(pattern => pattern.test(cleanMsg))) {
            return {
                reply: intent.reply,
                action: intent.action || null,
                category: intent.category
            };
        }
    }
    return null;
}

// ============================================
// BUILD KNOWLEDGE STRING FOR AI
// ============================================
function buildKnowledgeString() {
    if (!database || !database.categories) return '';

    let knowledge = '';
    for (const category of database.categories) {
        knowledge += `\n### ${category.name}\n`;
        for (const faq of category.faqs || []) {
            knowledge += `Q: ${faq.q}\nA: ${faq.a}\n\n`;
        }
    }
    return knowledge;
}

// ============================================
// GEMINI AI FUNCTION
// ============================================
async function callGoogleGemini(userMsg) {
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
        console.error('GOOGLE_API_KEY not set');
        return "I'm having trouble connecting. Please contact us at +918800609609 or care@bluewud.com";
    }

    // Use stable Gemini model
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const config = getConfig();
    const contact = config.contact || {};

    const systemPrompt = `You are Bluewud Furniture Expert - a friendly AI assistant for Bluewud, an Indian furniture brand.

CONTACT INFO:
📞 Phone/WhatsApp: ${contact.whatsapp || '+918800609609'}
📧 Email: ${contact.email || 'care@bluewud.com'}
⏰ Hours: ${contact.hours || '09:00 AM - 06:00 PM (Mon-Sat)'}

KEY FACTS:
- We sell ONLY Engineered Wood furniture (NOT solid wood/teak/sheesham)
- Free shipping above ₹999
- 1-year warranty on manufacturing defects
- DIY assembly with included hardware
- Products: TV Units, Coffee Tables, Study Tables, Shoe Racks, Wardrobes, Wall Shelves, etc.

CURRENT OFFER: Use code WINTER10 for 10% off!

FAQ DATABASE:
${buildKnowledgeString()}

RULES:
1. Keep responses SHORT (2-4 sentences)
2. Use emojis sparingly (1-2 max)
3. Be warm and helpful
4. If unsure, offer to connect with human support`;

    const body = {
        contents: [{ role: 'user', parts: [{ text: userMsg }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { temperature: 0.7, maxOutputTokens: 300 }
    };

    try {
        const resp = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await resp.json();

        if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            return data.candidates[0].content.parts[0].text;
        }

        console.error('Gemini API response:', JSON.stringify(data));
        return "I'd be happy to help! For detailed assistance, please contact us at +918800609609 or care@bluewud.com 😊";
    } catch (e) {
        console.error('Gemini API Error:', e.message);
        return "I'm having trouble connecting. Please contact us at +918800609609 or care@bluewud.com";
    }
}

// ============================================
// MAIN MESSAGE PROCESSOR
// ============================================
async function processMessage(message) {
    try {
        if (!message || message.trim() === '') {
            return { reply: "I didn't catch that. Could you please rephrase?", action: null };
        }

        // 1. Check quick intents (greetings, farewells, handoff)
        const intentMatch = findIntent(message);
        if (intentMatch) {
            return intentMatch;
        }

        // 2. Search FAQ database
        const faqMatch = searchFaqs(message);
        if (faqMatch) {
            return {
                reply: faqMatch.a,
                action: null,
                category: faqMatch.category
            };
        }

        // 3. Fall back to AI
        const aiReply = await callGoogleGemini(message);
        return { reply: aiReply, action: null, category: 'ai_response' };

    } catch (error) {
        console.error('processMessage error:', error);
        return {
            reply: "I'm having trouble right now. Please contact us at +918800609609 or care@bluewud.com",
            action: null
        };
    }
}

module.exports = { processMessage, getConfig, getMessage, searchFaqs };
