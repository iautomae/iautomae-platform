// Forced redeploy to link custom domain correctly
import { NextRequest, NextResponse } from 'next/server';

export const config = {
    matcher: [
        /*
         * Match all paths except:
         * 1. /api routes
         * 2. /_next (Next.js internals)
         * 3. /_static (inside /public)
         * 4. all root files inside /public (e.g. /favicon.ico)
         */
        '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
    ],
};

export default async function middleware(req: NextRequest) {
    const url = req.nextUrl;
    const hostname = req.headers.get('host') || '';

    // 1. Lógica para el Subdominio APP
    if (hostname.startsWith('app.')) {
        if (url.pathname === '/') {
            return NextResponse.rewrite(new URL('/dashboard', req.url));
        }
        return NextResponse.next();
    }

    // 2. Todo lo demás (Dominio Principal)
    return NextResponse.next();
}
