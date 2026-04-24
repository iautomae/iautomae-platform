import { NextResponse } from 'next/server';
import { getProfileById, requireAuth } from '@/lib/server-auth';
import {
    issueSecurityClearance,
    logSecurityEvent,
    verifyOtpChallenge,
} from '@/lib/security';

export async function POST(request: Request) {
    const { context, response } = await requireAuth(request, undefined, { skipSecurityCheck: true });
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
        purpose: 'login',
    });

    if (!verification.ok) {
        await logSecurityEvent({
            profileId: context.profile.id,
            email: context.profile.email,
            eventType: 'LOGIN_CHALLENGE_FAILED',
            request,
            metadata: { challengeId, reason: verification.reason },
        });

        return NextResponse.json(
            { error: 'Código inválido o expirado.', reason: verification.reason },
            { status: 400 }
        );
    }

    const successResponse = NextResponse.json({
        ok: true,
        status: 'verified',
    });

    await issueSecurityClearance(successResponse, {
        profileId: context.profile.id,
        request,
    });

    const profileLookup = await getProfileById(context.profile.id);
    await logSecurityEvent({
        profileId: context.profile.id,
        email: profileLookup.data?.email || context.profile.email,
        eventType: 'LOGIN_SUCCESS',
        request,
        metadata: { mode: '2fa_email' },
    });

    return successResponse;
}
