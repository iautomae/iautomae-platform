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

        const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${id}/add-to-knowledge-base`, {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json({ error: errorData.detail || 'Error uploading to knowledge base' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('KB Upload Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
