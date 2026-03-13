import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/server-auth';

export async function POST(request: Request) {
    try {
        const { slug } = await request.json();
        if (!slug || typeof slug !== 'string') {
            return NextResponse.json({ error: 'slug requerido' }, { status: 400 });
        }

        const supabaseAdmin = getSupabaseAdminClient();
        const { error } = await supabaseAdmin
            .from('tenants')
            .update({ branding_complete: true })
            .eq('slug', slug)
            .eq('is_active', true);

        if (error) {
            console.error('Error marking tenant active:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('Unexpected error in mark-active:', err);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
