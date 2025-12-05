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
        console.log(`✅ Database loaded: ${database._meta.totalFaqs} FAQs in ${database.categories.length} categories`);
        return true;
    } catch (error) {
        console.error('❌ Failed to load database:', error.message);
        return false;
    }
}

// Load on startup
loadDatabase();

// Reload database (call this after edits)
function reloadDatabase() {
    return loadDatabase();
}

// ============================================
// GET CONFIG & MESSAGES FROM DATABASE
// ============================================
function getConfig() {
    return database?.config || {};
}

function getMessage(key) {
    return database?.messages?.[key] || '';
}

// ============================================
// SEARCH FAQS BY KEYWORDS
// ============================================
function searchFaqs(query) {
    if (!database) return null;

    const queryLower = query.toLowerCase();
    const words = queryLower.split(/\s+/);

    let bestMatch = null;
    let bestScore = 0;

    for (const category of database.categories) {
        for (const faq of category.faqs) {
            let score = 0;

            // Check keywords
            for (const keyword of faq.keywords || []) {
                if (queryLower.includes(keyword.toLowerCase())) {
                    score += 10;
                }
            }

            // Check question text
            const qLower = faq.q.toLowerCase();
            for (const word of words) {
                if (word.length > 2 && qLower.includes(word)) {
                    score += 5;
                }
            }

            // Exact match bonus
            if (qLower.includes(queryLower) || queryLower.includes(qLower)) {
                score += 20;
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
// ENHANCED INTENT PATTERNS
// ============================================
const intents = [
    // Greetings
    {
        patterns: [/^hi$/i, /^hello$/i, /^hey$/i, /^hii+$/i, /good\s*(morning|afternoon|evening)/i, /^namaste/i],
        handler: () => "Hi there! 👋 How can I help you with your furniture needs today?",
        category: "greeting"
    },

    // Farewells
    {
        patterns: [/^bye$/i, /^goodbye$/i, /^thanks?\s*bye/i, /^ok\s*bye/i, /that'?s?\s*all/i],
        handler: () => getMessage('goodbye'),
        category: "farewell"
    },

    // Gratitude
    {
        patterns: [/^thanks?$/i, /^thank\s*you$/i, /^thx$/i, /^ty$/i],
        handler: () => "You're welcome! 😊 Is there anything else I can help you with?",
        category: "gratitude"
    },

    // Human Handoff (High Priority)
    {
        patterns: [
            /talk\s*to\s*(human|agent|person|someone)/i,
            /speak\s*(with|to)\s*(human|agent|person)/i,
            /customer\s*(care|service|support)/i,
            /call\s*(back|me)/i,
            /contact\s*(number|details)/i,
            /^agent$/i, /^human$/i, /^support$/i
        ],
        handler: () => getMessage('handoff'),
        category: "handoff",
        action: "handoff"
    }
];

function findIntent(message) {
    const cleanMsg = message.trim().toLowerCase();

    for (const intent of intents) {
        if (intent.patterns.some(pattern => pattern.test(cleanMsg))) {
            return {
                reply: intent.handler(),
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
    if (!database) return '';

    let knowledge = '';
    for (const category of database.categories) {
        knowledge += `\n### ${category.icon} ${category.name}\n`;
        for (const faq of category.faqs) {
            knowledge += `Q: ${faq.q}\nA: ${faq.a}\n\n`;
        }
    }
    return knowledge;
}

// ============================================
// GEMINI AI FUNCTION (Fallback)
// ============================================
async function callGoogleGemini(userMsg) {
    const apiKey = process.env.GOOGLE_API_KEY;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const config = getConfig();
    const contact = config.contact || {};

    const systemPrompt = `You are "${config.botName || 'Bluewud Furniture Expert'}" - a friendly AI assistant for Bluewud furniture.

## CONTACT INFO (provide when user needs help):
📞 Phone/WhatsApp: ${contact.whatsapp || '+918800609609'}
📧 Email: ${contact.email || 'care@bluewud.com'}
⏰ Hours: ${contact.hours || '09:00 AM - 06:00 PM (Mon-Sat)'}

## CURRENT OFFER:
${config.currentOffer?.name}: ${config.currentOffer?.discount} off with code "${config.currentOffer?.code}"

## KEY FACTS:
- We sell ONLY Engineered Wood (NOT solid wood/teak/sheesham)
- Free shipping above ₹999
- 1-year warranty on manufacturing defects
- DIY assembly with included hardware

## FAQ DATABASE:
${buildKnowledgeString()}

## RULES:
1. Keep responses SHORT (2-4 sentences)
2. Use the FAQ database for accurate answers
3. If unsure, offer to connect with human support
4. Use emojis sparingly (1-2 per response)
5. Be warm and helpful`;

    const body = {
        contents: [{ role: 'user', parts: [{ text: userMsg }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { temperature: 0.7, topP: 0.9, maxOutputTokens: 500 }
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
        console.error('Gemini API error:', JSON.stringify(data));
        return getMessage('error');
    } catch (e) {
        console.error('Gemini API Error:', e);
        return getMessage('error');
    }
}

// ============================================
// MAIN MESSAGE PROCESSOR
// ============================================
async function processMessage(message) {
    if (!message || message.trim() === '') {
        return { reply: "I didn't catch that. Could you please rephrase?", action: null };
    }

    // 1. Check hardcoded intents (greetings, farewells, handoff)
    const intentMatch = findIntent(message);
    if (intentMatch) {
        return intentMatch;
    }

    // 2. Search FAQ database
    const faqMatch = searchFaqs(message);
    if (faqMatch) {
        return {
            reply: `${faqMatch.icon} **${faqMatch.category}**\n\n${faqMatch.a}`,
            action: null,
            category: faqMatch.category,
            faqId: faqMatch.id
        };
    }

    // 3. Fall back to AI for complex queries
    const aiReply = await callGoogleGemini(message);
    return { reply: aiReply, action: null, category: 'ai_response' };
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
    processMessage,
    reloadDatabase,
    getConfig,
    getMessage,
    searchFaqs
};
