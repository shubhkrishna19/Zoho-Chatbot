require('dotenv').config();
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// ============================================
// LOAD DATABASES (FAQs + Products)
// ============================================
let database = null;
let productsDb = null;

function loadDatabases() {
    try {
        const dbPath = path.join(__dirname, 'data', 'database.json');
        if (fs.existsSync(dbPath)) {
            const data = fs.readFileSync(dbPath, 'utf8');
            database = JSON.parse(data);
            console.log(`✅ FAQs loaded: ${database.categories.length} categories`);
        }

        const prodPath = path.join(__dirname, 'data', 'products.json');
        if (fs.existsSync(prodPath)) {
            const prodData = fs.readFileSync(prodPath, 'utf8');
            productsDb = JSON.parse(prodData);
            console.log(`✅ Products loaded: ${productsDb.products.length} items`);
        }
    } catch (error) {
        console.error('❌ Failed to load databases:', error.message);
    }
}
loadDatabases();

// ============================================
// CONFIG & CONSTANTS
// ============================================
const CONFIG = {
    botName: "Bluewud Bot",
    contact: { phone: "+918800609609", email: "care@bluewud.com" }
};

const CATEGORY_URLS = {
    "TV Units": "https://bluewud.com/collections/tv-units-cabinets",
    "Coffee Tables": "https://bluewud.com/collections/coffee-tables",
    "Study Tables": "https://bluewud.com/collections/study-tables-desks",
    "Shoe Racks": "https://bluewud.com/collections/shoe-racks",
    "Wardrobes": "https://bluewud.com/collections/wardrobes",
    "Wall Shelves": "https://bluewud.com/collections/wall-shelves",
    "Beds": "https://bluewud.com/collections/beds",
    "Bedside Tables": "https://bluewud.com/collections/bedside-tables",
    "Dressing Console": "https://bluewud.com/collections/dressing-tables",
    "Dining Tables": "https://bluewud.com/collections/dining-tables",
    "Laptop Tables": "https://bluewud.com/collections/laptop-tables",
    "Book Shelves": "https://bluewud.com/collections/bookshelves"
};

// ============================================
// SEARCH LOGIC (RAG)
// ============================================
function searchFaqs(query) {
    if (!database || !database.categories) return [];

    const queryLower = query.toLowerCase();
    const words = queryLower.split(/\s+/).filter(w => w.length > 2);

    let matches = [];

    for (const category of database.categories) {
        for (const faq of category.faqs || []) {
            let score = 0;
            const qLower = (faq.q || '').toLowerCase();
            const keywords = faq.keywords || [];

            // 1. Keyword Exact Match (High weight)
            for (const kw of keywords) {
                if (queryLower.includes(kw.toLowerCase())) score += 15;
            }

            // 2. Question Word Match (Medium weight)
            let wordMatches = 0;
            for (const word of words) {
                if (qLower.includes(word)) {
                    score += 5;
                    wordMatches++;
                }
            }

            // Must match at least some context
            if (score > 10 || wordMatches >= 2) {
                matches.push({ ...faq, category: category.name, score });
            }
        }
    }

    // Sort by score and return top 3
    return matches.sort((a, b) => b.score - a.score).slice(0, 3);
}

function searchProducts(query) {
    if (!productsDb || !productsDb.products) return [];
    const queryLower = query.toLowerCase();
    const terms = queryLower.split(/[\s,]+/).filter(w => w.length > 2);

    return productsDb.products.filter(p => {
        const sku = (p.sku || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();

        // Exact SKU match
        if (sku === queryLower) return true;

        // Name/SKU contains term
        if (terms.some(t => sku.includes(t) || name.includes(t))) return true;

        return false;
    }).slice(0, 3); // Top 3 products
}

// ============================================
// INTENTS
// ============================================
const intents = [
    { patterns: [/^hi[!.]?$/i, /^hello[!.]?$/i, /^hey$/i], reply: "Hi! I'm Bluewud's AI assistant. I can help with products, specs, and policies.", category: "greeting" },
    { patterns: [/^bye[!.]?$/i, /^goodbye$/i], reply: "Goodbye! Have a nice day!", category: "farewell" },
    // Strict handoff: Must ask for human/agent specifically
    { patterns: [/talk.*human/i, /speak.*agent/i, /customer\s*care/i, /contact\s*support/i], reply: "📞 Call +918800609609 (9AM-6PM) or email care@bluewud.com", category: "handoff", action: "handoff" }
];

function findIntent(message) {
    const cleanMsg = message.trim().toLowerCase();
    for (const intent of intents) {
        if (intent.patterns.some(p => p.test(cleanMsg))) return intent;
    }
    return null;
}

// ============================================
// GEMINI AI CALL
// ============================================
async function callGoogleGemini(userMsg, productContext, faqContext) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) return "My brain is offline (API Key missing).";

    // Format Context
    const prodStr = productContext.length > 0
        ? "RELEVANT PRODUCTS:\n" + productContext.map(p => `- SKU: ${p.sku} | Name: ${p.name} | Dims: ${p.dimensions?.L}x${p.dimensions?.B}x${p.dimensions?.H}cm | Price: ₹${p.price}`).join('\n')
        : "NO SPECIFIC PRODUCTS FOUND.";

    const faqStr = faqContext.length > 0
        ? "RELEVANT FAQs:\n" + faqContext.map(f => `Q: ${f.q}\nA: ${f.a}`).join('\n\n')
        : "NO SPECIFIC FAQs FOUND.";

    const categoryLinks = Object.entries(CATEGORY_URLS)
        .map(([k, v]) => `- ${k}: ${v}`)
        .join('\n');

    const systemPrompt = `You are Bluewud's smart AI assistant.
    
    CORE DATA:
    ${prodStr}
    
    ${faqStr}
    
    SHOPPING LINKS:
    ${categoryLinks}
    
    CONTACT INFO:
    Phone: ${CONFIG.contact.phone}
    Email: ${CONFIG.contact.email}

    INSTRUCTIONS:
    1. ANSWER ONLY based on the "RELEVANT PRODUCTS" and "RELEVANT FAQs" provided above.
    2. If the user asks about a product NOT listed in "RELEVANT PRODUCTS", say "I couldn't find that specific product, but here are links to our collections:" and show relevant links.
    3. If the user query is about policies (shipping, warranty) and you have a matching FAQ, paraphrase the answer naturally.
    4. DO NOT invent information.
    5. Be friendly, professional, and concise.
    6. If unsure, tell them to contact support using the provided phone/email.

    USER QUERY: ${userMsg}`;

    const body = {
        contents: [{ role: 'user', parts: [{ text: userMsg }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { temperature: 0.1, maxOutputTokens: 400 }
    };

    try {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await resp.json();
        console.error("Gemini Response FULL:", JSON.stringify(data, null, 2));
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        return text || "I'm having trouble thinking. Please contact support.";
    } catch (e) {
        console.error("Gemini Error:", e.message);
        if (e.response) {
            console.error("Response:", await e.response.text());
        }
        return "I'm having trouble connecting to my brain.";
    }
}

// ============================================
// MAIN PROCESS
// ============================================
async function processMessage(message) {
    try {
        if (!message?.trim()) return { reply: "Please say something." };

        // 1. Check Intents (Strict Handcoded)
        const intent = findIntent(message);
        if (intent) return intent;

        // 2. RAG: Search DB
        const products = searchProducts(message);
        const faqs = searchFaqs(message);

        // 3. AI Generation
        const aiReply = await callGoogleGemini(message, products, faqs);
        return { reply: aiReply, category: 'ai_response' };

    } catch (error) {
        console.error("Brain Error:", error);
        return { reply: "Error processing request, please call support." };
    }
}

module.exports = { processMessage };
