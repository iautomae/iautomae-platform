import { NextResponse } from 'next/server';
import {
    getProfileById,
    getSupabaseAdminClient,
    hasFeatureAccess,
    requireAuth,
} from '@/lib/server-auth';

const supabaseAdmin = getSupabaseAdminClient();

export async function POST(req: Request) {
    try {
        const { context, response } = await requireAuth(req, ['admin', 'tenant_owner']);
        if (response || !context) {
            return response!;
        }

        const { userId, featureKey, newValue, leadsVisibleAdvisors } = await req.json();

        if (!userId || !featureKey || typeof newValue !== 'boolean') {
            return NextResponse.json(
                { error: 'userId, featureKey y newValue (boolean) son requeridos.' },
                { status: 400 }
            );
        }

        // Validate leadsVisibleAdvisors if provided
        if (leadsVisibleAdvisors !== undefined && featureKey === 'leads') {
            const valid = leadsVisibleAdvisors === 'all' || (
                Array.isArray(leadsVisibleAdvisors) &&
                leadsVisibleAdvisors.every((v: unknown) => [1, 2, 3].includes(v as number))
            );
            if (!valid) {
                return NextResponse.json(
                    { error: 'leadsVisibleAdvisors debe ser "all" o un array de [1,2,3].' },
                    { status: 400 }
                );
            }
        }

        if (!/^[a-z0-9:_-]+$/i.test(featureKey)) {
            return NextResponse.json({ error: 'El featureKey es inválido.' }, { status: 400 });
        }

        const { data: targetProfile, error: targetError } = await getProfileById(userId);
        if (targetError || !targetProfile) {
            return NextResponse.json({ error: 'Perfil no encontrado.' }, { status: 404 });
        }

        if (context.profile.role === 'tenant_owner') {
            if (!context.profile.tenant_id || context.profile.tenant_id !== targetProfile.tenant_id) {
                return NextResponse.json({ error: 'No puedes modificar usuarios de otro tenant.' }, { status: 403 });
            }

            if (targetProfile.role === 'admin') {
                return NextResponse.json({ error: 'No puedes modificar administradores globales.' }, { status: 403 });
            }

            if (!hasFeatureAccess(context.profile, featureKey)) {
                return NextResponse.json(
                    { error: 'No puedes asignar accesos que no tienes habilitados.' },
                    { status: 403 }
                );
            }
        }

        const { data: profile, error: readError } = await supabaseAdmin
            .from('profiles')
            .select('features, has_leads_access')
            .eq('id', userId)
            .single<{ features: Record<string, boolean> | null; has_leads_access: boolean | null }>();

        if (readError || !profile) {
            return NextResponse.json({ error: 'Perfil no encontrado.' }, { status: 404 });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newFeatures: Record<string, any> = { ...(profile.features || {}), [featureKey]: newValue };

        // Save advisor visibility when toggling leads
        if (featureKey === 'leads') {
            if (newValue && leadsVisibleAdvisors !== undefined) {
                newFeatures.leads_visible_advisors = leadsVisibleAdvisors;
            } else if (newValue && leadsVisibleAdvisors === undefined && !newFeatures.leads_visible_advisors) {
                // Default to "all" when enabling leads without specifying
                newFeatures.leads_visible_advisors = 'all';
            } else if (!newValue) {
                // Clean up advisor visibility when disabling leads
                delete newFeatures.leads_visible_advisors;
            }
        }

        const updatePayload: Record<string, unknown> = { features: newFeatures };

        if (featureKey === 'leads') {
            updatePayload.has_leads_access = newValue;
        }

        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update(updatePayload)
            .eq('id', userId);

        if (updateError) {
            console.error('toggle-access update error:', updateError);
            return NextResponse.json({ error: 'Error al actualizar el acceso.' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            features: newFeatures,
            has_leads_access: featureKey === 'leads' ? newValue : profile.has_leads_access,
        });
    } catch (error: unknown) {
        console.error('POST /api/admin/toggle-access error:', error);
        return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
    }
}
