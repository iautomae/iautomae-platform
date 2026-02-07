import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
    const url = req.nextUrl.clone();
    const host = req.headers.get('host') || '';

    // 1. If we are on the main domain and try to access /login directly, 
    // redirect to the app subdomain for a cleaner structure.
    if (!host.startsWith('app.') && url.pathname === '/login') {
        const appUrl = new URL('https://app.iautomae.com');
        return NextResponse.redirect(appUrl);
    }

    // 2. If we are on the app subdomain, handle the root rewrite
    if (host.startsWith('app.') || (host.includes('localhost:3000') && url.pathname.startsWith('/app'))) {
        if (url.pathname === '/') {
            url.pathname = '/login';
            return NextResponse.rewrite(url);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
