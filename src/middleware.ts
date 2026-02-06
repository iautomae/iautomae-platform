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
    if (hostname.includes('app.')) {
        // Si entran a app.iautomae.com/ -> mostrar el dashboard interno
        if (url.pathname === '/') {
            return NextResponse.rewrite(new URL('/dashboard', req.url));
        }
        // Otras rutas de app como /leads se mantienen igual
        return NextResponse.next();
    }

    // 2. Lógica para el Dominio Principal (Marketing)
    // Las rutas ahora se manejan directamente en el sistema de archivos (src/app/(marketing)/page.tsx)
    return NextResponse.next();

    // Rutas como /compressor, /privacy-policy, etc. ya existen en el grupo marketing
    return NextResponse.next();
}
