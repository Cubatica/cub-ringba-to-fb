const axios = require('axios');
const express = require('express');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Main function executed when the route is hit
app.post('/api/event', async (req, res) => {
    console.log('Received request body:', JSON.stringify(req.body, null, 2)); // Log the incoming request body
// Helper function to hash data (for phone number in this case)
function hashData(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

// Function to normalize phone number
function normalizePhoneNumber(phone) {
    // Remove non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Ensure the phone number includes the country code
    if (cleaned.length === 10) {
        return '1' + cleaned; // Prepend country code for US numbers
    } else if (cleaned.length > 10 && cleaned.startsWith('1')) {
        return cleaned; // Return as is if already has country code
    } else {
        throw new Error('Invalid phone number format. Must include country code.');
    }
}

// Function to format the fbc parameter
function formatFbc(fbclid) {
    const version = 'fb';
    const subdomainIndex = 0; // Assuming the domain is 'com'
    const creationTime = Math.floor(Date.now() / 1000); // Current timestamp in seconds

    return `${version}.${subdomainIndex}.${creationTime}.${fbclid}`;
}

// Define valid action sources
const validActionSources = [
    'email',
    'website',
    'app',
    'phone_call',
    'chat',
    'physical_store',
    'system_generated',
    'business_messaging',
    'other'
];

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
        // Extract input
        const { PIXEL_ID, ACCESS_TOKEN } = req.body;

        // Validate required fields
        if (!PIXEL_ID || !ACCESS_TOKEN) {
            return res.status(400).json({ error: 'Missing required fields: PIXEL_ID and ACCESS_TOKEN' });
        }

        // Format the fbc parameter if fbclid is provided
        let fbc = null;
        if (fbclid) {
            fbc = formatFbc(fbclid);
        }

        // Log the fbc value for debugging
        console.log('Formatted fbc:', fbc);

        // Extract action_source from request body
        const action_source = req.body.action_source || 'website';

        // Validate action_source
        if (!validActionSources.includes(action_source)) {
            return res.status(400).json({ error: 'Invalid action_source value.' });
        }

        // Prepare data for Facebook's Conversions API
        const eventData = {
            data: [{
                event_name: 'Purchase', // Default event name
                event_time: Math.floor(Date.now() / 1000), // Current time in seconds
                user_data: {}, // Optional user data can be added here
                custom_data: {
                    value: 0, // Default value
                    currency: 'USD' // Default currency
                }
            }]
        };

        // Log the event data for debugging
        console.log('Data being sent to Facebook:', JSON.stringify(eventData, null, 2));

        const apiVersion = 'v18.0'; // API version
        const url = `https://graph.facebook.com/${apiVersion}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`; // Facebook API URL

        // Send event to Facebook
        const response = await axios.post(url, eventData, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Check for errors in the response
        if (response.status !== 200) {
            console.error('Error from Facebook API:', response.data);
            return res.status(500).json({ error: 'Failed to send data to Facebook' });
        }

        console.log('Event sent successfully:', response.data); // Log the response from Facebook

        // Prepare the response
        return res.status(200).json({
            success: true,
            data: {
                events_received: 1,
                messages: [],
                fbtrace_id: response.data.fbtrace_id, // Assuming fbtrace_id is part of the response from Facebook
                hashed_phone: hashedPhone, // Include the hashed phone number in the response
                hashed_zip: hashedZip // Include the hashed zip code in the response
            }
        });
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

