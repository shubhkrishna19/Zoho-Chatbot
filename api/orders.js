const cors = require('cors');

// Initialize CORS middleware
const corsHandler = cors({
    origin: '*',
    methods: ['POST', 'OPTIONS'],
});

function runMiddleware(req, res, fn) {
    return new Promise((resolve, reject) => {
        fn(req, res, (result) => {
            if (result instanceof Error) return reject(result);
            return resolve(result);
        });
    });
}

module.exports = async (req, res) => {
    // Enable CORS
    await runMiddleware(req, res, corsHandler);

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { orderId, phone } = req.body || {};

    // Mock Logic
    // In real world, this would query Shopify/WooCommerce API

    // Simulate lookup delay
    await new Promise(r => setTimeout(r, 1000));

    if (!orderId && !phone) {
        return res.status(400).json({ status: "Error", message: "Please provide an Order ID." });
    }

    // Demo Data
    const mockDb = {
        "12345": { status: "Out for Delivery 🚚", date: "Today", courier: "BlueDart" },
        "55555": { status: "Delivered ✅", date: "Yesterday" },
        "99999": { status: "Processing ⚙️", date: "Est. Dec 12" }
    };

    const orderRaw = orderId ? orderId.toString().trim() : "";
    const result = mockDb[orderRaw];

    if (result) {
        return res.status(200).json({
            found: true,
            orderId: orderRaw,
            ...result
        });
    } else {
        return res.status(200).json({
            found: false,
            message: "Order not found. Check the ID and try again."
        });
    }
};
