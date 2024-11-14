const axios = require('axios');
const express = require('express');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Main function executed when the route is hit
app.post('/api/event', async (req, res) => {
    const { ph, value, PIXEL_ID, ACCESS_TOKEN, source_url, zp, state, city, fbc, fbp, client_ip_address, client_user_agent, event_name, action_source } = req.body;

    // Validate input
    if (!ph || value === undefined || !PIXEL_ID || !ACCESS_TOKEN || !source_url || !zp || !state || !city || !fbc || !fbp || !client_ip_address || !client_user_agent || !event_name || !action_source) {
        return res.status(400).json({ error: 'Missing required fields: ph, value, PIXEL_ID, ACCESS_TOKEN, source_url, zp, state, city, fbc, fbp, client_ip_address, client_user_agent, event_name, and action_source are required' });
    }

    // Proceed with processing the request...
});

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

