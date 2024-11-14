const axios = require('axios');
const crypto = require('crypto');
const express = require('express');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

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
        const { ph, value, currency, PIXEL_ID, ACCESS_TOKEN, source_url, fbclid, event_name } = req.query;

        // Validate input
        if (!ph || (value === undefined || value === null) || !PIXEL_ID || !ACCESS_TOKEN || !source_url || !event_name) {
            return res.status(400).json({ error: 'Missing required fields: ph, value, PIXEL_ID, ACCESS_TOKEN, source_url, and event_name are required' });
        }

        // Extract action_source from query parameters
        const action_source = req.query.action_source || 'website';

        // Validate action_source
        if (!validActionSources.includes(action_source)) {
            return res.status(400).json({ error: 'Invalid action_source value.' });
        }

        // You can add logic here to handle the GET request as needed
        return res.status(200).json({ message: `${event_name} event received`, data: req.query });
    }

    // Extract purchase data from the request body for POST
    const { ph, value, currency, PIXEL_ID, ACCESS_TOKEN, source_url, fbclid, event_name, client_ip_address, client_user_agent } = req.body;

    // Validate input
    if (!ph || (value === undefined || value === null) || !PIXEL_ID || !ACCESS_TOKEN || !source_url || !event_name || !client_ip_address || !client_user_agent) {
        return res.status(400).json({ error: 'Missing required fields: ph, value, PIXEL_ID, ACCESS_TOKEN, source_url, event_name, client_ip_address, and client_user_agent are required' });
    }

    try {
        // Normalize and hash the user's phone number to protect privacy
        const normalizedPhone = normalizePhoneNumber(ph);
        const hashedPhone = hashData(normalizedPhone); // Hash the normalized phone number

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
                event_name: 'Purchase',
                event_time: Math.floor(Date.now() / 1000),
                user_data: {
                    ph: [hashedPhone],  // Facebook expects an array of hashed values
                    fbc: fbc,  // Include the formatted fbc
                    client_ip_address: client_ip_address, // Include the client IP address (not hashed)
                    client_user_agent: client_user_agent // Include the client user agent (not hashed)
                },
                custom_data: {
                    value: value,  // Use the value from the request body
                    currency: currency || 'USD',
                },
                event_source_url: source_url,  // Updated to include event source URL
                action_source: action_source,  // Updated to use dynamic action source
            }]
        };

        // Log the event data for debugging
        console.log('Data being sent to Facebook:', JSON.stringify(eventData, null, 2)); // Log the event data

        const apiVersion = 'v18.0'; // Added API version
        const url = `https://graph.facebook.com/${apiVersion}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`; // Updated URL

        // Prepare the request body
        const requestBody = {
            ph: hashedPhone,
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

        // Prepare the response to include the hashed phone number and hashed zip code
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
        console.error('Error sending event:', error); // Log the entire error object
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

// Allow GET method for /api/purchase
app.get('/api/purchase', (req, res) => {
    const { ph, value, currency, PIXEL_ID, ACCESS_TOKEN, source_url, event_name } = req.query;

    // Validate input
    if (!ph || (value === undefined || value === null) || !PIXEL_ID || !ACCESS_TOKEN || !source_url || !event_name) {
        return res.status(400).json({ error: 'Missing required fields: ph, value, PIXEL_ID, ACCESS_TOKEN, source_url, and event_name are required' });
    }

    // Extract action_source from query parameters
    const action_source = req.query.action_source || 'website';

    // Validate action_source
    if (!validActionSources.includes(action_source)) {
        return res.status(400).json({ error: 'Invalid action_source value.' });
    }

    // Process the request
    return res.status(200).json({ message: `${event_name} event received`, data: req.query });
});

// Allow POST method for /api/purchase
app.post('/api/purchase', (req, res) => {
    const { ph, value, currency, PIXEL_ID, ACCESS_TOKEN, source_url, event_name } = req.body;

    // Validate input
    if (!ph || (value === undefined || value === null) || !PIXEL_ID || !ACCESS_TOKEN || !source_url || !event_name) {
        return res.status(400).json({ error: 'Missing required fields: ph, value, PIXEL_ID, ACCESS_TOKEN, source_url, and event_name are required' });
    }

    // Extract action_source from request body
    const action_source = req.body.action_source || 'website';

    // Validate action_source
    if (!validActionSources.includes(action_source)) {
        return res.status(400).json({ error: 'Invalid action_source value.' });
    }

    // Process the request
    return res.status(200).json({ message: `${event_name} event received`, data: req.body });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

