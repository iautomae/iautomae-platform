import { NextResponse } from 'next/server';

export async function GET() {
    const apiKey = process.env.ELEVEN_LABS_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
    }

    try {
        const response = await fetch('https://api.elevenlabs.io/v1/convai/agents', {
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

export async function POST(request: Request) {
    const apiKey = process.env.ELEVEN_LABS_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
    }

    try {
        const body = await request.json();

        // Construct the payload for ElevenLabs
        // We default to some values if not provided, but the frontend should provide name and prompt
        const elevenLabsPayload = {
            conversation_config: {
                agent: {
                    prompt: {
                        prompt: body.prompt || "Eres un asistente virtual."
                    },
                    first_message: "Hola, ¿en qué puedo ayudarte?",
                    language: "es" // Default to Spanish as per context
                },
                tts: {
                    model_id: "eleven_turbo_v2_5" // Required for Spanish / Multilingual support
                }
            },
            name: body.name || "Nuevo Agente"
        };


        const response = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(elevenLabsPayload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('ElevenLabs Creation Error:', errorData);
            return NextResponse.json({ error: errorData.detail || 'Error creating agent in ElevenLabs' }, { status: response.status });
        }

        const data = await response.json();
        // data.agent_id contains the new ID
        return NextResponse.json(data);

    } catch (error) {
        console.error('Proxy Creation Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
