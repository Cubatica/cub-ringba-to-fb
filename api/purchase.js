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

        // Ensure value is a number
        const numericValue = Number(value);

        // Prepare data for Facebook's Conversions API
        const eventData = {
            data: [{
                event_name: 'Purchase',
                event_time: Math.floor(Date.now() / 1000),
                user_data: {
                    ph: [hashedPhone],  // Facebook expects an array of hashed values
                },
                custom_data: {
                    value: numericValue,  // Ensure value is a number
                    currency: currency || 'USD',
                    source_url: source_url  // Include the source URL
                }
            }]
        };

        // Prepare the request body
        const requestBody = {
            phone: hashedPhone,
            value: numericValue,  // Allow 0 as a valid value
            currency: currency,
            PIXEL_ID: PIXEL_ID,
            ACCESS_TOKEN: ACCESS_TOKEN,
            source_url: source_url,
            zip: hashedZip,
            st: hashedState,
            ct: hashedCity,
            fbc: fbc,
            client_ip_address: client_ip_address,
            client_user_agent: client_user_agent
        };

        // Log the request body for debugging
        console.log('Request Body:', requestBody);

        // Send event to Facebook
        const response = await axios.post('https://your-api-endpoint.com/purchase', requestBody, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        console.log('Event sent successfully:', response.data);
        return res.status(200).json({ success: true, data: response.data });
    } catch (error) {
        console.error('Error sending event:', error.response?.data || error.message);
        console.log('Request Body:', requestBody); // Log the request body
        return res.status(500).json({ error: error.response?.data?.error?.message || error.message });
    }
};

