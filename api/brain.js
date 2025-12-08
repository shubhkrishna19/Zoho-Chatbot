require('dotenv').config();
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

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
// LOAD DATABASES (FAQs + Products + Names)
// ============================================
let database = null;
let productsDb = null;
let productNames = [];

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

        const namePath = path.join(__dirname, 'data', 'product_names.json');
        if (fs.existsSync(namePath)) {
            const nameData = fs.readFileSync(namePath, 'utf8');
            productNames = JSON.parse(nameData);
            console.log(`✅ Product Names loaded: ${productNames.length} mappings`);
        }
    } catch (error) {
        console.error('❌ Failed to load databases:', error.message);
    }
}
loadDatabases();

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

            // Must match at least some context (STRICTER)
            // 1 keyword (15) OR 3+ context words (15)
            if (score >= 15 || wordMatches >= 3) {
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

    // 1. CHECK NAME MAPPING FIRST
    let targetSku = null;
    let targetName = null;

    if (productNames.length > 0) {
        const found = productNames.find(p =>
            queryLower.includes(p.name.toLowerCase()) ||
            p.keywords.some(k => queryLower.includes(k.toLowerCase()))
        );
        if (found) {
            targetSku = found.sku;
            targetName = found.name;
        }
    }

    // 2. SEARCH PRODUCTS
    const terms = queryLower.split(/[\s,]+/).filter(w => w.length > 2);

    return productsDb.products.filter(p => {
        const sku = (p.sku || '').toLowerCase();

        // Exact SKU match (or mapped SKU)
        if (targetSku && sku.includes(targetSku.toLowerCase().replace('-xx', ''))) return true;
        if (sku === queryLower) return true;

        // Name/SKU contains term
        if (terms.some(t => sku.includes(t))) return true;

        return false;
    }).map(p => {
        // Attach English Name if found
        if (targetName) p.name = targetName;
        return p;
    }).slice(0, 3);
}

// ============================================
// INTENTS
// ============================================
const intents = [
    { patterns: [/^hi[!.]?$/i, /^hello[!.]?$/i, /^hey$/i], reply: "Hi! I'm Bluewud's AI assistant. I can help with products, specs, and policies.", category: "greeting" },
    { patterns: [/^bye[!.]?$/i, /^goodbye$/i], reply: "Goodbye! Have a nice day!", category: "farewell" },
    // Strict handoff: Must ask for human
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

    const hasProducts = productContext.length > 0;
    const prodStr = hasProducts
        ? "RELEVANT PRODUCTS FOUND:\n" + productContext.map(p => `- SKU: ${p.sku} | Name: ${p.name} | Dims: ${p.dimensions?.L}x${p.dimensions?.B}x${p.dimensions?.H}cm | Price: ₹${p.price}`).join('\n')
        : "NO MATCHING PRODUCTS FOUND IN DATABASE.";

    const faqStr = faqContext.length > 0
        ? "RELEVANT FAQs:\n" + faqContext.map(f => `Q: ${f.q}\nA: ${f.a}`).join('\n\n')
        : "NO RELEVANT FAQs FOUND.";

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

    CRITICAL RULES:
    1. IF "NO MATCHING PRODUCTS FOUND" is shown above, and the user asks for specific product details (dimensions, price, material of a specific item), YOU MUST SAY: "I couldn't find details for that specific product in my database. Please contact support or check our website."
    2. DO NOT use the "RELEVANT FAQs" to answer specific product sizing questions unless the FAQ is explicitly about that specific model.
    3. If the user asks general questions (warranty, shipping), use the "RELEVANT FAQs".
    4. Be helpful but truthful. Do not Hallucinate or guess dimensions.
    
    USER QUERY: ${userMsg}`;

    const body = {
        contents: [{ role: 'user', parts: [{ text: userMsg }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { temperature: 0.1, maxOutputTokens: 1000 }
    };

    try {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await resp.json();
        console.error("Gemini Response DEBUG:", JSON.stringify(data, null, 2));
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        return text || "I'm having trouble thinking. Please contact support.";
    } catch (e) {
        console.error("Gemini Error:", e.message);
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
