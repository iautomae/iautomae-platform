import { NextResponse } from 'next/server';
import { getSupabaseAdminClient, requireAuth } from '@/lib/server-auth';

const supabaseAdmin = getSupabaseAdminClient();
const PROTECTED_SLUGS = ['iautomae', 'app', 'hub'];

export async function POST(req: Request) {
    try {
        const { response } = await requireAuth(req, ['admin']);
        if (response) {
            return response;
        }

        const { userId, tenantId } = await req.json();

        if (!userId && !tenantId) {
            return NextResponse.json({ error: 'Falta el ID del usuario o del tenant.' }, { status: 400 });
        }

        let targetTenantId = tenantId as string | undefined;

        if (!targetTenantId && userId) {
            const { data: profile, error: profileError } = await supabaseAdmin
                .from('profiles')
                .select('tenant_id')
                .eq('id', userId)
                .single<{ tenant_id: string | null }>();

            if (profileError || !profile?.tenant_id) {
                return NextResponse.json({ error: 'Perfil no encontrado.' }, { status: 404 });
            }

            targetTenantId = profile.tenant_id;
        }

        if (!targetTenantId) {
            return NextResponse.json({ error: 'No se pudo resolver el tenant.' }, { status: 400 });
        }

        const { data: tenant, error: tenantLookupError } = await supabaseAdmin
            .from('tenants')
            .select('slug')
            .eq('id', targetTenantId)
            .single<{ slug: string }>();

        if (tenantLookupError || !tenant) {
            return NextResponse.json({ error: 'Tenant no encontrado.' }, { status: 404 });
        }

        if (PROTECTED_SLUGS.includes(tenant.slug)) {
            return NextResponse.json(
                { error: 'No se puede eliminar la cuenta de administración maestra.' },
                { status: 403 }
            );
        }

        const { data: linkedProfiles, error: linkedProfilesError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('tenant_id', targetTenantId);

        if (linkedProfilesError) {
            console.error('Error fetching tenant profiles:', linkedProfilesError);
            return NextResponse.json({ error: 'Error al obtener los usuarios del tenant.' }, { status: 500 });
        }

        for (const profile of linkedProfiles || []) {
            const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(profile.id);
            if (deleteAuthError) {
                console.error('Error deleting auth user:', deleteAuthError);
                return NextResponse.json({ error: 'Error al eliminar los usuarios del tenant.' }, { status: 500 });
            }
        }

        const { error: tenantError } = await supabaseAdmin
            .from('tenants')
            .delete()
            .eq('id', targetTenantId);

        if (tenantError) {
            console.error('Error deleting tenant:', tenantError);
            return NextResponse.json({ error: 'Error al eliminar la empresa.' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Empresa eliminada permanentemente.' });
    } catch (error: unknown) {
        console.error('Remove tenant API error:', error);
        return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
    }
}
