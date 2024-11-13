const axios = require('axios');
const crypto = require('crypto');
const express = require('express');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Helper function to hash data (for phone number in this case)
function hashData(data) {
    return crypto.createHash('sha256').update(data.trim().toLowerCase()).digest('hex');
}

// Function to format the fbc parameter
function formatFbc(fbclid) {
    const version = 'fb';
    const subdomainIndex = 0; // Assuming the domain is 'com'
    const creationTime = Math.floor(Date.now() / 1000); // Current timestamp in seconds

    return `${version}.${subdomainIndex}.${creationTime}.${fbclid}`;
}

// This will be the main function executed when the route is hit
module.exports = async (req, res) => {
    // Allow both POST and GET methods
    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).send('Method Not Allowed');
    }

    // Handle GET request
    if (req.method === 'GET') {
        // Extract query parameters
        const { phone, value, currency, PIXEL_ID, ACCESS_TOKEN, source_url, fbclid, event_name } = req.query;

        // Validate input
        if (!phone || (value === undefined || value === null) || !PIXEL_ID || !ACCESS_TOKEN || !source_url || !event_name) {
            return res.status(400).json({ error: 'Missing required fields: phone, value, PIXEL_ID, ACCESS_TOKEN, source_url, and event_name are required' });
        }

        // You can add logic here to handle the GET request as needed
        // For example, you might want to log the data or return a success message
        return res.status(200).json({ message: `${event_name} event received`, data: req.query });
    }

    // Extract purchase data from the request body for POST
    const { phone, value, currency, PIXEL_ID, ACCESS_TOKEN, source_url, fbclid, event_name } = req.body;

    // Validate input
    if (!phone || (value === undefined || value === null) || !PIXEL_ID || !ACCESS_TOKEN || !source_url || !event_name) {
        return res.status(400).json({ error: 'Missing required fields: phone, value, PIXEL_ID, ACCESS_TOKEN, source_url, and event_name are required' });
    }

    try {
        // Hash the user's phone number to protect privacy
        const hashedPhone = hashData(phone.replace('+', '')); // Remove '+' and hash

        // Format the fbc parameter if fbclid is provided
        let fbc = null;
        if (fbclid) {
            fbc = formatFbc(fbclid);
        }

        // Log the fbc value for debugging
        console.log('Formatted fbc:', fbc);

        // Prepare data for Facebook's Conversions API
        const eventData = {
            data: [{
                event_name: 'Purchase',
                event_time: Math.floor(Date.now() / 1000),
                user_data: {
                    ph: [hashedPhone],  // Facebook expects an array of hashed values
                    fbc: fbc,  // Include the formatted fbc
                },
                custom_data: {
                    value: value,  // Use the value from the request body
                    currency: currency || 'USD',
                },
                event_source_url: source_url,  // Updated to include event source URL
                action_source: 'website',  // Added action source
            }]
        };

        console.log('Data being sent to Facebook:', JSON.stringify(eventData, null, 2)); // Log the event data

        const apiVersion = 'v18.0'; // Added API version
        const url = `https://graph.facebook.com/${apiVersion}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`; // Updated URL

        // Prepare the request body
        const requestBody = {
            phone: hashedPhone,
            value: value,  // Set value to the incoming value from the request body
            currency: currency,
            PIXEL_ID: PIXEL_ID,
            ACCESS_TOKEN: ACCESS_TOKEN,
            source_url: source_url,
            fbc: fbc  // Include the formatted fbc in the request body
        };

        // Log the request body for debugging
        console.log('Request Body:', requestBody);

        // Send event to Facebook
        const response = await axios.post(url, eventData, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        console.log('Event sent successfully:', response.data); // Log the response from Facebook

        // Update the response to include meaningful data
        return res.status(200).json({ success: true, data: response.data }); // Ensure response.data is meaningful
    } catch (error) {
        console.error('Error sending event:', error.response ? error.response.data : error.message);
        console.log('Request Body:', JSON.stringify(requestBody, null, 2)); // Log the request body
        return res.status(500).json({ error: error.response?.data?.error?.message || error.message });
    }
};

// Allow GET method for /api/purchase
app.get('/api/purchase', (req, res) => {
    const { phone, value, currency, PIXEL_ID, ACCESS_TOKEN, source_url, event_name } = req.query;

    // Validate input
    if (!phone || (value === undefined || value === null) || !PIXEL_ID || !ACCESS_TOKEN || !source_url || !event_name) {
        return res.status(400).json({ error: 'Missing required fields: phone, value, PIXEL_ID, ACCESS_TOKEN, source_url, and event_name are required' });
    }

    // Process the request
    return res.status(200).json({ message: `${event_name} event received`, data: req.query });
});

// Allow POST method for /api/purchase
app.post('/api/purchase', (req, res) => {
    const { phone, value, currency, PIXEL_ID, ACCESS_TOKEN, source_url, event_name } = req.body;

    // Validate input
    if (!phone || (value === undefined || value === null) || !PIXEL_ID || !ACCESS_TOKEN || !source_url || !event_name) {
        return res.status(400).json({ error: 'Missing required fields: phone, value, PIXEL_ID, ACCESS_TOKEN, source_url, and event_name are required' });
    }

    // Process the request
    return res.status(200).json({ message: `${event_name} event received`, data: req.body });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

