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

// Helper function to hash zip code
function hashZipCode(zip) {
    // Use only the first 5 digits for U.S. zip codes
    const cleanedZip = zip.replace(/\D/g, '').substring(0, 5).toLowerCase();
    return crypto.createHash('sha256').update(cleanedZip).digest('hex');
}

// Helper function to hash city
function hashCity(city) {
    // Normalize the city name: lowercase, remove punctuation, special characters, and spaces
    const normalizedCity = city.toLowerCase().replace(/[^a-z]/g, '');
    return crypto.createHash('sha256').update(normalizedCity).digest('hex');
}

// Helper function to hash state
function hashState(state) {
    // Normalize the state: use 2-character ANSI abbreviation code in lowercase
    const normalizedState = state.trim().toLowerCase().substring(0, 2);
    return crypto.createHash('sha256').update(normalizedState).digest('hex');
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
    const subdomainIndex = 1; // This should be 1 based on your example
    const creationTime = Math.floor(Date.now() * 1000); // Current timestamp in milliseconds

    return `${version}.${subdomainIndex}.${fbclid}.${fbc}`; // Correctly using fbclid and fbc
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
        const { ph, value, currency, PIXEL_ID, ACCESS_TOKEN, source_url, fbclid, event_name } = req.query;
        return res.status(200).json({ message: `${event_name} event received`, data: req.query });
    }

    // Extract purchase data from the request body for POST
    const { ph, value, currency, PIXEL_ID, ACCESS_TOKEN, source_url, zp, fbp, fbc, event_name, client_ip_address, client_user_agent, ct, st, action_source } = req.body;

    try {
        // Log the incoming city and state for debugging
        console.log('Incoming city (ct):', ct);
        console.log('Incoming state (st):', st);

        // Normalize and hash the user's phone number
        const normalizedPhone = normalizePhoneNumber(ph);
        const hashedPhone = hashData(normalizedPhone);

        // Format the fbc parameter if fbclid is provided
        let fbc = null;
        if (fbp) {
            fbc = formatFbc(fbp);
        }

        // Check if fbc is in the correct format
        if (fbc && !/^fb\.[0-9]+\.[0-9a-f]{32}$/.test(fbc)) {
            console.error('Invalid fbc format:', fbc);
            return res.status(400).json({ error: 'Invalid fbc format' });
        }

        // Log the fbc value for debugging
        console.log('Formatted fbc:', fbc);

        // Hash the zip code
        const hashedZip = hashZipCode(zp);

        // Normalize and hash the city
        const hashedCity = hashCity(ct); // Normalize and hash city
        // Normalize and hash the state
        const hashedState = hashState(st); // Normalize and hash state

        // Log the fbp and fbc values for debugging
        console.log('fbp:', fbp);
        console.log('fbc:', fbc);

        // Prepare data for Facebook's Conversions API
        const eventData = {
            data: [{
                event_name: event_name,
                event_time: Math.floor(Date.now() / 1000),
                user_data: {
                    ph: [hashedPhone],
                    fbc: fbc,
                    fbp: fbp,
                    client_ip_address: client_ip_address,
                    client_user_agent: client_user_agent,
                    ct: [hashedCity], // Added hashed city
                    st: [hashedState], // Added hashed state
                    zp: [hashedZip], // Added hashed zip code
                },
                custom_data: {
                    value: value,
                    currency: currency || 'USD',
                },
                event_source_url: source_url,
                action_source: action_source,
            }]
        };

        // Log the event data for debugging
        console.log('Data being sent to Facebook:', JSON.stringify(eventData, null, 2));

        const apiVersion = 'v18.0';
        const url = `https://graph.facebook.com/${apiVersion}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;

        // Send event to Facebook
        const response = await axios.post(url, eventData, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        console.log('Response from Facebook API:', response.data);

        // Prepare the response
        return res.status(200).json({
            success: true,
            data: {
                events_received: 1,
                fbtrace_id: response.data.fbtrace_id,
                hashed_phone: hashedPhone,
                hashed_zip: hashedZip,
            }
        });
    } catch (error) {
        console.error('Error sending event:', error.message); // Log the error message
        console.error('Error details:', error); // Log the entire error object
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Allow GET method for /api/purchase
app.get('/api/purchase', (req, res) => {
    const { ph, value, currency, PIXEL_ID, ACCESS_TOKEN, source_url, event_name } = req.query;
    return res.status(200).json({ message: `${event_name} event received`, data: req.query });
});

// Allow POST method for /api/purchase
app.post('/api/purchase', (req, res) => {
    const { ph, value, currency, PIXEL_ID, ACCESS_TOKEN, source_url, event_name } = req.body;
    return res.status(200).json({ message: `${event_name} event received`, data: req.body });
});

