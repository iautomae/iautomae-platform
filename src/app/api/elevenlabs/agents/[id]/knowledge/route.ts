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
        const file = formData.get('file') as File | null;
        const fileName = file?.name || 'documento';

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
        const newDocName = uploadData.name || fileName;

        if (!newDocId) {
            return NextResponse.json(uploadData);
        }

        // Step 2: Fetch current agent to get existing KB entries
        const agentResponse = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${id}`, {
            headers: { 'xi-api-key': apiKey },
        });

        if (!agentResponse.ok) {
            return NextResponse.json(uploadData);
        }

        const agentData = await agentResponse.json();
        const currentKb = agentData.conversation_config?.agent?.prompt?.knowledge_base || [];

        // Step 3: Build updated KB list with all existing + new doc
        // Must include: type, id, name, usage_mode (all required by ElevenLabs)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updatedKb = currentKb.map((doc: any) => ({
            type: doc.type || 'file',
            id: doc.id,
            name: doc.name || doc.file_name || 'documento',
            usage_mode: doc.usage_mode || 'auto',
        }));
        updatedKb.push({
            type: 'file',
            id: newDocId,
            name: newDocName,
            usage_mode: 'auto',
        });

        // Step 4: PATCH agent to include the new doc in its KB
        const patchResponse = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${id}`, {
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

        if (!patchResponse.ok) {
            const patchError = await patchResponse.text();
            console.error('PATCH KB error:', patchError);
            return NextResponse.json({ ...uploadData, linked: false, patchError });
        }

        return NextResponse.json({ ...uploadData, linked: true });
    } catch (error) {
        console.error('KB Upload Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
