import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
    try {
        // Create the platforms table using raw SQL via Supabase REST
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        const sqlResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': serviceKey,
                'Authorization': `Bearer ${serviceKey}`,
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

                    ALTER TABLE public.platforms ENABLE ROW LEVEL SECURITY;

                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_policies WHERE tablename = 'platforms' AND policyname = 'Allow all for authenticated'
                        ) THEN
                            CREATE POLICY "Allow all for authenticated" ON public.platforms
                                FOR ALL USING (true) WITH CHECK (true);
                        END IF;
                    END $$;
                `
            })
        });

        let rpcWorked = sqlResponse.ok;

        if (!rpcWorked) {
            // Fallback: try using the Supabase Management API or just seed directly
            console.log('RPC not available, trying direct insert to check if table exists...');
        }

        // Seed default platforms
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
            return NextResponse.json({
                success: false,
                error: error.message,
                hint: 'You may need to create the table manually. Run this SQL in your Supabase SQL Editor:\n\nCREATE TABLE public.platforms (\n  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n  name TEXT NOT NULL UNIQUE,\n  description TEXT NOT NULL DEFAULT \'\',\n  icon TEXT NOT NULL DEFAULT \'Layers\',\n  color TEXT NOT NULL DEFAULT \'blue\',\n  is_active BOOLEAN NOT NULL DEFAULT true,\n  created_at TIMESTAMPTZ DEFAULT now()\n);\n\nALTER TABLE public.platforms ENABLE ROW LEVEL SECURITY;\nCREATE POLICY "Allow all for authenticated" ON public.platforms FOR ALL USING (true) WITH CHECK (true);'
            }, { status: 500 });
        }

        return NextResponse.json({ success: true, platforms: data, rpcWorked });
    } catch (error: any) {
        console.error('Setup error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
