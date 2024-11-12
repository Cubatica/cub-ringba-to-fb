const axios = require('axios');
const crypto = require('crypto');

// Helper function to hash data (for phone number, ZIP code, city)
function hashData(data) {
    return crypto.createHash('sha256').update(data.trim()).digest('hex');
}

// Function to format and hash the state abbreviation
function formatAndHashState(state) {
    // Normalize to lowercase and ensure it's 2 characters
    const formattedState = state.toLowerCase().substring(0, 2); // Take the first 2 characters
    return hashData(formattedState);
}

// Function to format and hash the city name
function formatAndHashCity(city) {
    // Convert to lowercase and remove special characters
    const formattedCity = city.toLowerCase().replace(/[^a-z]/g, ''); // Keep only a-z characters
    return hashData(formattedCity);
}

// Function to send purchase event
async function sendPurchaseEvent(phone, value, currency, PIXEL_ID, ACCESS_TOKEN, source_url, zip, st, fbc, ct, client_ip_address, client_user_agent) {
    // Hash the phone number, ZIP code, state, and city
    const hashedPhone = hashData(phone);
    const hashedZip = hashData(zip);
    const hashedState = formatAndHashState(st);  // Format and hash the state abbreviation
    const hashedCity = formatAndHashCity(ct);    // Format and hash the city name

    const requestBody = {
        phone: hashedPhone,  // Use the hashed phone number
        value: value,
        currency: currency,
        PIXEL_ID: PIXEL_ID,
        ACCESS_TOKEN: ACCESS_TOKEN,
        source_url: source_url,
        zip: hashedZip,  // Use the hashed ZIP code
        st: hashedState,  // Use the hashed state abbreviation
        fbc: fbc,         // Include the Facebook Click ID without hashing
        ct: hashedCity,   // Include the hashed city name
        client_ip_address: client_ip_address,  // Include the client IP address
        client_user_agent: client_user_agent    // Include the client user agent
    };

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
    3, 
    'USD', 
    '769496975311812', 
    'YOUR_ACCESS_TOKEN', 
    'https://example.com/purchase', 
    '12345', 
    'California',  // Example state name
    'fb_click_id_example', 
    'New York',  // Example city name
    '192.0.2.1',  // Example IP address
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'  // Example User-Agent
);

