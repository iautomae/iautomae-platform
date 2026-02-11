import { NextResponse } from 'next/server';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const apiKey = process.env.ELEVEN_LABS_API_KEY;
    const { id } = await params;

    if (!apiKey) {
        return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
    }

    try {
        const formData = await request.formData();

        // Step 1: Upload file to ElevenLabs knowledge base
        const uploadResponse = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${id}/add-to-knowledge-base`, {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey,
            },
            body: formData,
        });

        if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            return NextResponse.json({ error: errorData.detail || 'Error uploading to knowledge base' }, { status: uploadResponse.status });
        }

        const uploadData = await uploadResponse.json();
        const newDocId = uploadData.id;

        if (!newDocId) {
            return NextResponse.json(uploadData);
        }

        // Step 2: Fetch current agent to get existing KB entries
        const agentResponse = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${id}`, {
            headers: { 'xi-api-key': apiKey },
        });

        if (!agentResponse.ok) {
            return NextResponse.json(uploadData); // File uploaded but couldn't link
        }

        const agentData = await agentResponse.json();
        const currentKb = agentData.conversation_config?.agent?.prompt?.knowledge_base || [];

        // Step 3: Build updated KB list with all existing + new doc
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updatedKb = currentKb.map((doc: any) => ({
            type: doc.type || 'file',
            id: doc.id,
        }));
        updatedKb.push({ type: 'file', id: newDocId });

        // Step 4: PATCH agent to include the new doc in its KB
        await fetch(`https://api.elevenlabs.io/v1/convai/agents/${id}`, {
            method: 'PATCH',
            headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                conversation_config: {
                    agent: {
                        prompt: {
                            knowledge_base: updatedKb,
                        },
                    },
                },
            }),
        });

        return NextResponse.json({ ...uploadData, linked: true });
    } catch (error) {
        console.error('KB Upload Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
