import { NextResponse } from 'next/server';
import { getSupabaseAdminClient, requireAuth } from '@/lib/server-auth';

const supabaseAdmin = getSupabaseAdminClient();

export async function GET(request: Request) {
    try {
        const { response } = await requireAuth(request, ['admin']);
        if (response) {
            return response;
        }

        const { data, error } = await supabaseAdmin
            .from('agentes')
            .select('user_id');

        if (error) {
            throw error;
        }

        const counts: Record<string, number> = {};
        for (const agent of data || []) {
            if (agent.user_id) {
                counts[agent.user_id] = (counts[agent.user_id] || 0) + 1;
            }
        }

        return NextResponse.json({ counts });
    } catch (error: unknown) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
    }
}
