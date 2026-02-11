import { NextResponse } from 'next/server';

export async function GET() {
    const apiKey = process.env.ELEVEN_LABS_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
    }

    try {
        const response = await fetch('https://api.elevenlabs.io/v1/convai/phone-numbers', {
            headers: {
                'xi-api-key': apiKey
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json({ error: errorData.detail || 'Error from ElevenLabs' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Proxy Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
