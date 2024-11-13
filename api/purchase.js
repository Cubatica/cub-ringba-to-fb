const axios = require('axios');
const crypto = require('crypto');

// Helper function to hash data
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

// Main function executed when the route is hit
module.exports = async (req, res) => {
    if (req.method !== 'GET') { // Change to GET method
        return res.status(405).send('Method Not Allowed');
    }

    // Extract parameters from the query string
    const {
        phone,
        value,
        currency,
        source_url,
        zip,
        st,
        ct,
        fbc,
        client_ip_address,
        client_user_agent
    } = req.query;

    // Validate input
    if (!phone || (value === undefined || value === null) || !source_url) {
        return res.status(400).json({ error: 'Missing required fields: phone, value, and source_url are required' });
    }

    try {
        // Hash the user's phone number
        const hashedPhone = hashData(phone.replace('+', '')); // Remove '+' and hash

        // Format the fbc parameter if fbclid is provided
        let formattedFbc = null;
        if (fbc) {
            formattedFbc = formatFbc(fbc);
        }

        // Prepare data for Facebook's Conversions API
        const eventData = {
            data: [{
                event_name: 'Purchase',
                event_time: Math.floor(Date.now() / 1000),
                user_data: {
                    ph: [hashedPhone],  // Facebook expects an array of hashed values
                    fbc: formattedFbc,  // Include the formatted fbc
                },
                custom_data: {
                    value: value,  // Use the value from the query string
                    currency: currency || 'USD',
                },
                event_source_url: source_url,  // Updated to include event source URL
                action_source: 'website',  // Added action source
            }]
        };

        const apiVersion = 'v18.0'; // API version
        const url = `https://graph.facebook.com/${apiVersion}/events`; // Updated URL without PIXEL_ID and ACCESS_TOKEN

        // Send event to Facebook
        const response = await axios.post(url, eventData, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        console.log('Event sent successfully:', response.data); // Log the response from Facebook
        return res.status(200).json({ success: true, data: response.data });
    } catch (error) {
        console.error('Error sending event:', error.response ? error.response.data : error.message);
        return res.status(500).json({ error: error.response?.data?.error?.message || error.message });
    }
};

