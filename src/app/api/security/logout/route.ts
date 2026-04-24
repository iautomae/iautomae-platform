import { NextResponse } from 'next/server';
import { clearSecurityCookie, revokeSecurityClearance } from '@/lib/security';

export async function POST(request: Request) {
    await revokeSecurityClearance(request);

    const response = NextResponse.json({ success: true });
    clearSecurityCookie(response);
    return response;
}
