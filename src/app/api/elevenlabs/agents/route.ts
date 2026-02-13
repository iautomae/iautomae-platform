import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase for backend check
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
    const apiKey = process.env.ELEVEN_LABS_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
    }

    try {
        // 1. Fetch agents from ElevenLabs
        const response = await fetch('https://api.elevenlabs.io/v1/convai/agents', {
            headers: { 'xi-api-key': apiKey }
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json({ error: errorData.detail || 'Error from ElevenLabs' }, { status: response.status });
        }

        const elData = await response.json();
        const elAgents = Array.isArray(elData) ? elData : (elData.agents || []);

        // 2. Fetch assigned agents from our DB
        const { data: assignedAgents, error: dbError } = await supabase
            .from('agentes')
            .select('eleven_labs_agent_id')
            .not('eleven_labs_agent_id', 'is', null);

        if (dbError) throw dbError;

        const assignedIds = new Set(assignedAgents.map(a => a.eleven_labs_agent_id));

        // 3. Filter and Randomize
        const availableAgents = elAgents.filter((a: { agent_id: string }) => !assignedIds.has(a.agent_id));

        if (availableAgents.length === 0) {
            return NextResponse.json({
                error: 'No hay agentes disponibles en el pool en este momento.',
                agents: []
            }, { status: 404 });
        }

        // Pick ONE random
        const randomIndex = Math.floor(Math.random() * availableAgents.length);
        const selectedAgent = availableAgents[randomIndex];

        // Return as an array of 1 to keep compatibility with frontend if needed, 
        // or just the single object. I'll return the object but the frontend will handle it.
        return NextResponse.json({
            agents: [selectedAgent], // Keep array for UI compatibility
            total_available: availableAgents.length
        });

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
