
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { key, token, title, message } = await request.json();

        if (!key || !token || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const response = await fetch('https://api.pushover.net/1/messages.json', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token: token,
                user: key,
                title: title || 'Pushover Test',
                message: message,
                html: 1,
            }),
        });

        if (response.ok) {
            return NextResponse.json({ success: true });
        } else {
            const errorData = await response.json();
            return NextResponse.json({ error: errorData }, { status: response.status });
        }
    } catch (error) {
        console.error('Error sending Pushover test:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
