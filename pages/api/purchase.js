import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req, res) {
    try {
        // Log the incoming request
        console.log('Request received:', {
            method: req.method,
            body: req.body,
            envVars: {
                hasPixelId: !!process.env.FACEBOOK_PIXEL_ID,
                hasAccessToken: !!process.env.FACEBOOK_ACCESS_TOKEN
            }
        });

        // Basic validation
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        // Echo back the received data for testing
        return res.status(200).json({
            received: req.body,
            status: 'success'
        });

    } catch (error) {
        console.error('Error details:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
} 