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
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const fileName = file?.name || 'documento';

        // ── Step 1: Upload file to ElevenLabs general knowledge base ──
        const uploadFormData = new FormData();
        if (file) {
            uploadFormData.append('file', file);
        }

        const uploadResponse = await fetch(
            'https://api.elevenlabs.io/v1/convai/knowledge-base/file',
            {
                method: 'POST',
                headers: { 'xi-api-key': apiKey },
                body: uploadFormData,
            }
        );

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('[KB Upload] Step 1 FAILED – Upload to general KB:', uploadResponse.status, errorText);
            return NextResponse.json(
                { error: `Error uploading to knowledge base: ${errorText}` },
                { status: uploadResponse.status }
            );
        }

        const uploadData = await uploadResponse.json();
        const newDocId = uploadData.id;
        const newDocName = uploadData.name || fileName;
        console.log('[KB Upload] Step 1 OK – Document uploaded:', { newDocId, newDocName });

        if (!newDocId) {
            console.error('[KB Upload] No document ID returned from upload:', uploadData);
            return NextResponse.json(uploadData);
        }

        // ── Step 2: Fetch current agent to get existing KB entries ──
        const agentResponse = await fetch(
            `https://api.elevenlabs.io/v1/convai/agents/${agentId}`,
            { headers: { 'xi-api-key': apiKey } }
        );

        if (!agentResponse.ok) {
            const agentErrText = await agentResponse.text();
            console.error('[KB Upload] Step 2 FAILED – Fetch agent:', agentResponse.status, agentErrText);
            // Still return the upload data – file was uploaded but not linked
            return NextResponse.json({ ...uploadData, linked: false, error: 'Could not fetch agent to link document' });
        }

        const agentData = await agentResponse.json();
        const currentKb = agentData.conversation_config?.agent?.prompt?.knowledge_base || [];
        console.log('[KB Upload] Step 2 OK – Current KB has', currentKb.length, 'documents');

        // ── Step 3: Build updated KB array (existing + new doc) ──
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updatedKb = currentKb.map((doc: any) => ({
            type: doc.type || 'file',
            id: doc.id,
            name: doc.name || doc.file_name || 'documento',
            usage_mode: doc.usage_mode || 'auto',
        }));

        // Avoid duplicate entries
        if (!updatedKb.some((d: { id: string }) => d.id === newDocId)) {
            updatedKb.push({
                type: 'file',
                id: newDocId,
                name: newDocName,
                usage_mode: 'auto',
            });
        }

        console.log('[KB Upload] Step 3 – Updated KB payload:', JSON.stringify(updatedKb, null, 2));

        // ── Step 4: PATCH agent to link the document ──
        const patchBody = {
            conversation_config: {
                agent: {
                    prompt: {
                        knowledge_base: updatedKb,
                    },
                },
            },
        };

        const patchResponse = await fetch(
            `https://api.elevenlabs.io/v1/convai/agents/${agentId}`,
            {
                method: 'PATCH',
                headers: {
                    'xi-api-key': apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(patchBody),
            }
        );

        if (!patchResponse.ok) {
            const patchError = await patchResponse.text();
            console.error('[KB Upload] Step 4 FAILED – PATCH agent:', patchResponse.status, patchError);
            return NextResponse.json({ ...uploadData, linked: false, patchError });
        }

        const patchData = await patchResponse.json();
        const linkedKb = patchData.conversation_config?.agent?.prompt?.knowledge_base || [];
        console.log('[KB Upload] Step 4 OK – Agent patched. KB now has', linkedKb.length, 'documents');

        return NextResponse.json({ ...uploadData, linked: true, kbCount: linkedKb.length });
    } catch (error) {
        console.error('[KB Upload] Unexpected Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
