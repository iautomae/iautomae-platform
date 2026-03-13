import { NextResponse } from 'next/server';
import { getSupabaseAdminClient, requireAuth } from '@/lib/server-auth';

const supabaseAdmin = getSupabaseAdminClient();

export async function POST(req: Request) {
    try {
        const { context, response } = await requireAuth(req, ['tenant_owner']);
        if (response || !context) {
            return response!;
        }

        const { memberId, newRole } = await req.json();

        if (!memberId || !newRole || !['tenant_owner', 'client'].includes(newRole)) {
            return NextResponse.json({ error: 'memberId y newRole (tenant_owner | client) son requeridos.' }, { status: 400 });
        }

        const { data: callerProfile } = await supabaseAdmin
            .from('profiles')
            .select('id, role, tenant_id')
            .eq('id', context.profile.id)
            .single();

        if (!callerProfile) {
            return NextResponse.json({ error: 'Perfil no encontrado.' }, { status: 403 });
        }

        const { data: memberProfile } = await supabaseAdmin
            .from('profiles')
            .select('id, role, tenant_id')
            .eq('id', memberId)
            .single();

        if (!memberProfile || memberProfile.tenant_id !== callerProfile.tenant_id) {
            return NextResponse.json({ error: 'El miembro no pertenece a tu equipo.' }, { status: 400 });
        }

        if (memberId === callerProfile.id) {
            return NextResponse.json({ error: 'No puedes cambiar tu propio rol.' }, { status: 400 });
        }

        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ role: newRole })
            .eq('id', memberId);

        if (updateError) {
            console.error('Error updating role:', updateError);
            return NextResponse.json({ error: 'Error al actualizar el rol.' }, { status: 500 });
        }

        return NextResponse.json({ success: true, newRole });
    } catch (error: unknown) {
        console.error('POST /api/tenant/change-role error:', error);
        return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
    }
}
