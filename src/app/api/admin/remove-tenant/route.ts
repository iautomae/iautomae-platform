import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Usa Service Role para poder saltar RLS y borrar datos críticos
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const { userId, tenantId } = await req.json();

        if (!userId && !tenantId) {
            return NextResponse.json({ error: 'Falta el ID del usuario o del tenant' }, { status: 400 });
        }

        // SLUGS protegidos que nunca se pueden borrar
        const PROTECTED_SLUGS = ['iautomae', 'app', 'hub'];

        // --- FLUJO A: Borrar por tenantId directamente (para tenants huérfanos sin usuarios) ---
        if (tenantId && !userId) {
            // Verificar que no sea un tenant protegido
            const { data: tenant } = await supabaseAdmin
                .from('tenants')
                .select('slug')
                .eq('id', tenantId)
                .single();

            if (tenant && PROTECTED_SLUGS.includes(tenant.slug)) {
                return NextResponse.json({ error: 'No se puede eliminar la cuenta de administración maestra' }, { status: 403 });
            }

            // Borrar cualquier perfil asociado (y su auth user)
            const { data: linkedProfiles } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('tenant_id', tenantId);

            if (linkedProfiles && linkedProfiles.length > 0) {
                for (const sp of linkedProfiles) {
                    await supabaseAdmin.auth.admin.deleteUser(sp.id);
                }
            }

            // Borrar el tenant
            const { error: tenantError } = await supabaseAdmin
                .from('tenants')
                .delete()
                .eq('id', tenantId);

            if (tenantError) {
                console.error("Error al borrar tenant:", tenantError);
                return NextResponse.json({ error: 'Error al eliminar la empresa' }, { status: 500 });
            }

            return NextResponse.json({ success: true, message: "Empresa eliminada permanentemente" });
        }

        // --- FLUJO B: Borrar por userId (flujo original) ---
        // 1. Obtener el perfil para saber qué Tenant borrar
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('tenant_id, role')
            .eq('id', userId)
            .single();

        if (profileError || !profile) {
            console.error("Profile not found:", profileError);
            return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
        }

        // Protección extra: No permitimos borrar si es admin maestro
        if (profile.role === 'admin') {
            const { data: tenant } = await supabaseAdmin
                .from('tenants')
                .select('slug')
                .eq('id', profile.tenant_id)
                .single();

            if (tenant && PROTECTED_SLUGS.includes(tenant.slug)) {
                return NextResponse.json({ error: 'No se puede eliminar la cuenta de administración maestra' }, { status: 403 });
            }
        }

        // 2. Borrar sub-usuarios del mismo tenant
        const { data: subProfiles } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('tenant_id', profile.tenant_id);

        if (subProfiles && subProfiles.length > 0) {
            for (const sp of subProfiles) {
                await supabaseAdmin.auth.admin.deleteUser(sp.id);
            }
        } else {
            await supabaseAdmin.auth.admin.deleteUser(userId);
        }

        // 3. Finalmente, borrar la Empresa (Tenant)
        if (profile.tenant_id) {
            const { error: tenantError } = await supabaseAdmin
                .from('tenants')
                .delete()
                .eq('id', profile.tenant_id);

            if (tenantError) {
                console.error("Error al borrar tenant:", tenantError);
            }
        }

        return NextResponse.json({ success: true, message: "Empresa y dependencias eliminadas permanentemente" });

    } catch (error) {
        console.error("Remove tenant API error:", error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
