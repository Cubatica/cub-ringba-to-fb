const axios = require('axios');
const crypto = require('crypto');

// Helper function to hash data (for phone number in this case)
function hashData(data) {
    return crypto.createHash('sha256').update(data.trim()).digest('hex');
}

// This will be the main function executed when the route is hit
module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    // Extract purchase data from the request body
    const { phone, value, currency, PIXEL_ID, ACCESS_TOKEN, source_url } = req.body;

    // Validate input
    if (!phone || !value || !PIXEL_ID || !ACCESS_TOKEN || !source_url) {
        return res.status(400).json({ error: 'Missing required fields: phone, value, PIXEL_ID, ACCESS_TOKEN, and source_url are required' });
    }

    try {
        // Hash the user's phone number to protect privacy
        const hashedPhone = hashData(phone);

        // Prepare data for Facebook's Conversions API
        const eventData = {
            data: [{
                event_name: 'Purchase',
                event_time: Math.floor(Date.now() / 1000),
                user_data: {
                    ph: [hashedPhone],  // Facebook expects an array of hashed values
                },
                custom_data: {
                    value: parseFloat(value),  // Ensure value is a number
                    currency: currency || 'USD',
                    source_url: source_url  // Include the source URL
                }
            }]
        };

        // Send event to Facebook
        const response = await axios.post(
            `https://graph.facebook.com/v16.0/${PIXEL_ID}/events`,
            eventData,
            {
                params: { access_token: ACCESS_TOKEN },
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );

        console.log('Event sent to Facebook:', response.data);
        return res.status(200).json({ success: true, data: response.data });
    } catch (error) {
        const errorMessage = error.response?.data?.error?.message || error.message;
        console.error('Error sending event to Facebook:', errorMessage);
        return res.status(500).json({ error: errorMessage });
    }
};
