import { NextResponse } from 'next/server';
import { getSupabaseAdminClient, requireAuth } from '@/lib/server-auth';

const supabaseAdmin = getSupabaseAdminClient();

export async function POST(request: Request) {
    try {
        const { response } = await requireAuth(request, ['admin']);
        if (response) {
            return response;
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        const sqlResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                apikey: serviceKey,
                Authorization: `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({
                sql: `
                    CREATE TABLE IF NOT EXISTS public.platforms (
                        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                        name TEXT NOT NULL UNIQUE,
                        description TEXT NOT NULL DEFAULT '',
                        icon TEXT NOT NULL DEFAULT 'Layers',
                        color TEXT NOT NULL DEFAULT 'blue',
                        is_active BOOLEAN NOT NULL DEFAULT true,
                        created_at TIMESTAMPTZ DEFAULT now()
                    );
                `,
            }),
        });

        const rpcWorked = sqlResponse.ok;

        const defaults = [
            { name: 'Trámites', description: 'Gestión de licencias, tarjetas de propiedad y trámites documentarios.', icon: 'FileText', color: 'blue', is_active: true },
            { name: 'Leads', description: 'CRM de captación de clientes, seguimiento de prospectos y conversiones.', icon: 'Users', color: 'emerald', is_active: true },
            { name: 'Reclutamiento', description: 'Gestión de vacantes, candidatos y procesos de selección de personal.', icon: 'Briefcase', color: 'purple', is_active: true },
            { name: 'Textil', description: 'Control de operaciones textiles, inventario y producción.', icon: 'Shirt', color: 'amber', is_active: true },
        ];

        const { data, error } = await supabaseAdmin
            .from('platforms')
            .upsert(defaults, { onConflict: 'name' })
            .select();

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, platforms: data, rpcWorked });
    } catch (error: unknown) {
        console.error('Setup error:', error);
        return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
    }
}
