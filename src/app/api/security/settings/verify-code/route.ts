import { NextResponse } from 'next/server';
import { getSupabaseAdminClient, requireAuth } from '@/lib/server-auth';
import { logSecurityEvent, verifyOtpChallenge } from '@/lib/security';

const supabaseAdmin = getSupabaseAdminClient();

export async function POST(request: Request) {
    const { context, response } = await requireAuth(request);
    if (response || !context) {
        return response!;
    }

    const body = await request.json();
    const challengeId = typeof body.challengeId === 'string' ? body.challengeId.trim() : '';
    const code = typeof body.code === 'string' ? body.code.trim() : '';

    if (!challengeId || !code) {
        return NextResponse.json({ error: 'Faltan challengeId o código.' }, { status: 400 });
    }

    const verification = await verifyOtpChallenge({
        profileId: context.profile.id,
        challengeId,
        code,
        purpose: 'setup_email',
    });

    if (!verification.ok) {
        return NextResponse.json({ error: 'Código inválido o expirado.', reason: verification.reason }, { status: 400 });
    }

    const verifiedEmail = verification.email;

    const { error } = await supabaseAdmin
        .from('profile_security_settings')
        .upsert({
            profile_id: context.profile.id,
            two_factor_email: verifiedEmail,
            two_factor_enabled: true,
            allowed_countries: ['PE'],
            notify_on_suspicious: true,
            alert_email: verifiedEmail,
            last_verified_at: new Date().toISOString(),
        });

    if (error) {
        return NextResponse.json({ error: 'No se pudo guardar el correo verificado.' }, { status: 500 });
    }

    await logSecurityEvent({
        profileId: context.profile.id,
        email: context.profile.email,
        eventType: '2FA_SETUP_COMPLETED',
        request,
        metadata: { verifiedEmail },
    });

    return NextResponse.json({
        success: true,
        twoFactorEmail: verifiedEmail,
        twoFactorEnabled: true,
    });
}
