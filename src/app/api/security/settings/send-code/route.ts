import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server-auth';
import {
    createOtpChallenge,
    logSecurityEvent,
    sendSecurityCodeEmail,
} from '@/lib/security';

export async function POST(request: Request) {
    const { context, response } = await requireAuth(request);
    if (response || !context) {
        return response!;
    }

    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email || !email.includes('@')) {
        return NextResponse.json({ error: 'Ingresa un correo válido.' }, { status: 400 });
    }

    const challenge = await createOtpChallenge({
        profileId: context.profile.id,
        email,
        purpose: 'setup_email',
    });

    await sendSecurityCodeEmail({
        to: email,
        code: challenge.code,
        purposeLabel: 'verificar tu correo de doble acceso',
    });

    await logSecurityEvent({
        profileId: context.profile.id,
        email: context.profile.email,
        eventType: '2FA_SETUP_CHALLENGE_SENT',
        request,
        metadata: { challengeId: challenge.challengeId, targetEmail: email },
    });

    return NextResponse.json({
        success: true,
        challengeId: challenge.challengeId,
        expiresAt: challenge.expiresAt,
    });
}
