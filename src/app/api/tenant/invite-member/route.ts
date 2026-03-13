import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getSupabaseAdminClient, requireAuth } from '@/lib/server-auth';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseAdmin = getSupabaseAdminClient();

export async function POST(req: Request) {
    try {
        const { context, response } = await requireAuth(req, ['tenant_owner']);
        if (response || !context) {
            return response!;
        }

        const { email, fullName } = await req.json();

        if (!email || !email.trim()) {
            return NextResponse.json({ error: 'El correo es obligatorio.' }, { status: 400 });
        }

        const { data: callerProfile, error: callerError } = await supabaseAdmin
            .from('profiles')
            .select('id, role, tenant_id, tenants(nombre, slug)')
            .eq('id', context.profile.id)
            .single();

        if (callerError || !callerProfile) {
            return NextResponse.json({ error: 'Perfil no encontrado.' }, { status: 403 });
        }

        const tenantId = callerProfile.tenant_id;
        const companyName = callerProfile.tenants?.nombre || 'tu empresa';
        const slug = callerProfile.tenants?.slug || '';

        if (!tenantId) {
            return NextResponse.json({ error: 'No se encontro el tenant asociado.' }, { status: 400 });
        }

        const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'opps.one').trim();
        const tenantBaseUrl = `https://${slug}.${rootDomain}`;

        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'invite',
            email: email.trim(),
            options: {
                redirectTo: `${tenantBaseUrl}/set-password`
            }
        });

        if (inviteError) {
            console.error('Error generating invite link:', inviteError);
            if (inviteError.message?.includes('already been registered')) {
                return NextResponse.json({ error: 'Este correo ya tiene una cuenta registrada.' }, { status: 400 });
            }
            return NextResponse.json({ error: 'Error al generar la invitacion.' }, { status: 500 });
        }

        const userId = inviteData.user.id;

        const verifyUrl = new URL(inviteData.properties.action_link);
        verifyUrl.searchParams.set('redirect_to', `${tenantBaseUrl}/set-password`);
        const actionLink = verifyUrl.toString();

        const profileData: Record<string, unknown> = {
            id: userId,
            email: email.trim(),
            tenant_id: tenantId,
            role: 'client',
            has_leads_access: false,
            features: {}
        };
        if (fullName && fullName.trim()) {
            profileData.full_name = fullName.trim();
        }

        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert(profileData);

        if (profileError) {
            console.error('Error creating profile:', profileError);
        }

        try {
            await resend.emails.send({
                from: `${companyName} <admin@opps.one>`,
                to: email.trim(),
                subject: `Has sido invitado al equipo de ${companyName}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 16px; background-color: #f9fafb; border-radius: 10px; border: 1px solid #e5e7eb;">
                        <div style="text-align: center; margin-bottom: 12px;">
                            <h1 style="color: #2CDB9B; margin: 0; font-size: 22px;">${companyName}</h1>
                        </div>
                        <div style="background-color: white; padding: 20px; border-radius: 8px;">
                            <h2 style="color: #111827; margin-top: 0; font-size: 16px;">${fullName ? `Hola ${fullName.trim()}, te` : 'Te'} han invitado al equipo</h2>
                            <p style="color: #4b5563; line-height: 1.5; font-size: 14px; margin: 8px 0 16px;">
                                Unete al equipo de <strong>${companyName}</strong>. Crea tu contrasena para comenzar.
                            </p>
                            <div style="text-align: center; margin: 16px 0;">
                                <a href="${actionLink}" style="background-color: #2CDB9B; color: #003327; font-weight: bold; text-decoration: none; padding: 10px 24px; border-radius: 8px; display: inline-block; font-size: 14px;">
                                    Aceptar Invitacion
                                </a>
                            </div>
                        </div>
                        <p style="text-align: center; color: #9ca3af; font-size: 11px; margin-top: 12px;">
                            (c) 2026 ${companyName}
                        </p>
                    </div>
                `
            });
        } catch (emailErr) {
            console.error('Error sending invite email:', emailErr);
        }

        return NextResponse.json({
            success: true,
            member: {
                id: userId,
                email: email.trim(),
                full_name: fullName?.trim() || null,
                role: 'client',
                features: {},
                has_leads_access: false
            }
        });
    } catch (error: unknown) {
        console.error('POST /api/tenant/invite-member error:', error);
        return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
    }
}
