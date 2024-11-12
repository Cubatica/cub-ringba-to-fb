const axios = require('axios');
const crypto = require('crypto');

// Helper function to hash data (for phone number, ZIP code, and state)
function hashData(data) {
    return crypto.createHash('sha256').update(data.trim()).digest('hex');
}

// Function to send purchase event
async function sendPurchaseEvent(phone, value, currency, PIXEL_ID, ACCESS_TOKEN, source_url, zip, st) {
    // Hash the phone number, ZIP code, and state
    const hashedPhone = hashData(phone);
    const hashedZip = hashData(zip);
    const hashedState = hashData(st);  // Hash the state abbreviation

    const requestBody = {
        phone: hashedPhone,  // Use the hashed phone number
        value: value,
        currency: currency,
        PIXEL_ID: PIXEL_ID,
        ACCESS_TOKEN: ACCESS_TOKEN,
        source_url: source_url,
        zip: hashedZip,  // Use the hashed ZIP code
        st: hashedState  // Use the hashed state abbreviation
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
sendPurchaseEvent('12563398448', 3, 'USD', '769496975311812', 'YOUR_ACCESS_TOKEN', 'https://example.com/purchase', '12345', 'NY');
