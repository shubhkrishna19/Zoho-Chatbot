const cors = require('cors');
const fetch = require('node-fetch');

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
    await runMiddleware(req, res, corsHandler);

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { orderId, phone, email } = req.body || {};
    const orderRaw = String(orderId || '').trim();
    const normalizedPhone = String(phone || '').replace(/\D/g, '');
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const orderHubBaseUrl = (process.env.ORDER_HUB_BASE_URL || '').trim().replace(/\/$/, '');

    if (!orderRaw) {
        return res.status(400).json({ status: 'Error', message: 'Please provide an Order ID.' });
    }

    if (orderHubBaseUrl) {
        if (!normalizedPhone && !normalizedEmail) {
            return res.status(200).json({
                found: false,
                source: 'order-hub',
                requiresVerification: true,
                message: 'Please enter the phone number or email used on the order.',
            });
        }

        try {
            const params = new URLSearchParams({ order_id: orderRaw });
            if (normalizedPhone) {
                params.set('phone', normalizedPhone);
            }
            if (normalizedEmail) {
                params.set('email', normalizedEmail);
            }

            const response = await fetch(
                `${orderHubBaseUrl}/api/customer/order-status?${params.toString()}`,
                {
                    method: 'GET',
                    headers: { Accept: 'application/json' },
                    timeout: 15000,
                }
            );

            if (!response.ok) {
                throw new Error(`OrderHub lookup failed with status ${response.status}`);
            }

            const payload = await response.json();
            if (!payload.found) {
                return res.status(200).json({
                    found: false,
                    source: 'order-hub',
                    requiresVerification: false,
                    message: payload.message || 'Order not found. Check the details and try again.',
                });
            }

            return res.status(200).json({
                found: true,
                source: 'order-hub',
                orderId: payload.order_id || orderRaw,
                canonicalOrderId: payload.canonical_order_id || '',
                status: payload.status || 'Processing',
                date: formatDate(payload.last_updated),
                timeline: payload.timeline || [],
            });
        } catch (error) {
            console.error('[orders] OrderHub lookup failed:', error);
            return res.status(200).json({
                found: false,
                source: 'order-hub',
                requiresVerification: false,
                message: 'I could not verify the live order status right now. Please try again in a moment or contact support with your Order ID.',
            });
        }
    }

    return res.status(200).json({
        found: false,
        source: 'disabled',
        requiresVerification: false,
        message:
            'Live order tracking is being enabled right now. Please contact support with your Order ID for an immediate update.',
    });
};

function formatDate(value) {
    if (!value) {
        return 'Live update pending';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return String(value);
    }

    return parsed.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
