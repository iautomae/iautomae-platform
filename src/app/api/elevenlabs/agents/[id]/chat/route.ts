import { NextResponse } from 'next/server';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const apiKey = process.env.ELEVEN_LABS_API_KEY;
    const { id: agentId } = await params;

    if (!apiKey) {
        return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
    }

    try {
        const { message, conversation_id } = await request.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // Use the ElevenLabs Conversational AI text chat endpoint
        const body: Record<string, unknown> = {
            agent_id: agentId,
            text: message,
        };

        // Include conversation_id if we have one (to continue a conversation)
        if (conversation_id) {
            body.conversation_id = conversation_id;
        }

        const response = await fetch(
            'https://api.elevenlabs.io/v1/convai/conversation/text',
            {
                method: 'POST',
                headers: {
                    'xi-api-key': apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Chat] ElevenLabs error:', response.status, errorText);
            return NextResponse.json(
                { error: `ElevenLabs error: ${errorText}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('[Chat] Unexpected Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
