const axios = require('axios');
const crypto = require('crypto');

// Helper function to hash data
function hashData(data) {
    return crypto.createHash('sha256').update(data.trim()).digest('hex');
}

// Function to format and hash the state abbreviation
function formatAndHashState(state) {
    const formattedState = state.toLowerCase().substring(0, 2); // Take the first 2 characters
    return hashData(formattedState);
}

// Function to format and hash the city name
function formatAndHashCity(city) {
    const formattedCity = city.toLowerCase().replace(/[^a-z]/g, ''); // Keep only a-z characters
    return hashData(formattedCity);
}

// Function to format and hash the ZIP code
function formatAndHashZip(zp) {
    // Check if the ZIP code is a U.S. ZIP code (5 digits)
    if (/^\d{5}$/.test(zp)) {
        return hashData(zp.toLowerCase()); // Hash the 5-digit U.S. ZIP code
    }
    // Check if the ZIP code is a UK ZIP code (area, district, sector format)
    else if (/^[a-z]\d[a-z]?\s*\d[a-z]{2}$/i.test(zp)) {
        const formattedUKZip = zp.toLowerCase().replace(/\s+/g, '').replace(/-/g, ''); // Remove spaces and dashes
        return hashData(formattedUKZip); // Hash the formatted UK ZIP code
    }
    // Handle other formats or throw an error
    else {
        throw new Error('Invalid ZIP code format');
    }
}

// Function to send purchase event
async function sendPurchaseEvent(phone, value, currency, PIXEL_ID, ACCESS_TOKEN, source_url, zp, st, fbc, ct, client_ip_address, client_user_agent) {
    // Hash the phone number, ZIP code, state, and city
    const hashedPhone = hashData(phone);
    const hashedZip = formatAndHashZip(zp);  // Format and hash the ZIP code
    const hashedState = formatAndHashState(st);  // Format and hash the state abbreviation
    const hashedCity = formatAndHashCity(ct);    // Format and hash the city name

    // Prepare the request body
    const requestBody = {
        phone: hashedPhone,  // Use the hashed phone number
        value: value,        // Allow 0 as a valid value
        currency: currency,
        PIXEL_ID: PIXEL_ID,
        ACCESS_TOKEN: ACCESS_TOKEN,
        source_url: source_url,
        zp: hashedZip,       // Use the hashed ZIP code (now zp)
        st: hashedState,     // Use the hashed state abbreviation
        ct: hashedCity,      // Include the hashed city name
        fbc: fbc,            // Include the Facebook Click ID without hashing
        client_ip_address: client_ip_address,  // Include the client IP address
        client_user_agent: client_user_agent    // Include the client user agent
    };

    // Log the request body for debugging
    console.log('Request Body:', requestBody);

    try {
        const response = await axios.post('https://your-api-endpoint.com/purchase', requestBody, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        console.log('Event sent successfully:', response.data);
    } catch (error) {
        console.error('Error sending event:', error.response?.data || error.message);
    }
}

// Example usage
sendPurchaseEvent(
    '12563398448', 
    0,  // Testing with value 0
    'USD', 
    '769496975311812', 
    'YOUR_ACCESS_TOKEN', 
    'https://example.com/purchase', 
    '94035',  // Example U.S. ZIP code
    'ca',     // Example state abbreviation
    'fb_click_id_example', 
    'New York',  // Example city name
    '192.0.2.1',  // Example IP address
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'  // Example User-Agent
);

