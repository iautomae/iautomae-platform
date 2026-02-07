import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
    const url = req.nextUrl.clone();
    const host = req.headers.get('host') || '';

    // Check if we are on app.iautomae.com or local
    const isAppSubdomain = host.startsWith('app.') || (host.includes('localhost:3000') && url.pathname.startsWith('/app'));

    if (isAppSubdomain) {
        // Redirect root of app subdomain to login
        if (url.pathname === '/') {
            url.pathname = '/login';
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
