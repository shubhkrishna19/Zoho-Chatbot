const orderApi = require('./api/orders');

async function testOrderApi() {
    console.log("--- TESTING ORDER API ---");

    // Mock Request/Response objects
    const req = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { orderId: '12345' } // Valid ID
    };

    const res = {
        statusCode: 0,
        headers: {},
        status: function (code) {
            this.statusCode = code;
            return this;
        },
        json: function (data) {
            console.log(`\nStatus: ${this.statusCode}`);
            console.log("Response:", JSON.stringify(data, null, 2));
        },
        setHeader: function (key, val) { this.headers[key] = val; }
    };

    try {
        await orderApi(req, res);
    } catch (e) {
        console.error("API Error:", e);
    }
}

testOrderApi();
