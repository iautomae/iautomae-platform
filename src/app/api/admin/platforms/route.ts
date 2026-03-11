import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Seed defaults if the table is empty
const DEFAULT_PLATFORMS = [
    { name: 'Trámites', description: 'Gestión de licencias, tarjetas de propiedad y trámites documentarios.', icon: 'FileText', color: 'blue', is_active: true },
    { name: 'Leads', description: 'CRM de captación de clientes, seguimiento de prospectos y conversiones.', icon: 'Users', color: 'emerald', is_active: true },
    { name: 'Reclutamiento', description: 'Gestión de vacantes, candidatos y procesos de selección de personal.', icon: 'Briefcase', color: 'purple', is_active: true },
    { name: 'Textil', description: 'Control de operaciones textiles, inventario y producción.', icon: 'Shirt', color: 'amber', is_active: true },
];

// Color palette for new platforms
const COLOR_PALETTE = ['blue', 'emerald', 'purple', 'amber', 'rose', 'cyan', 'indigo', 'orange'];
const ICON_PALETTE = ['FileText', 'Users', 'Briefcase', 'Shirt', 'Heart', 'Globe', 'Zap', 'Package'];

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('platforms')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            // If table doesn't exist, return empty with a hint
            if (error.code === '42P01' || error.message?.includes('does not exist')) {
                return NextResponse.json({ platforms: [], needsSetup: true });
            }
            throw error;
        }

        return NextResponse.json({ platforms: data || [] });
    } catch (error: any) {
        console.error('GET /api/admin/platforms error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { name, description, action } = await req.json();

        // Special action: setup table and seed
        if (action === 'setup') {
            // Try to insert defaults — if table exists, this will seed it
            const { error: seedError } = await supabaseAdmin
                .from('platforms')
                .upsert(DEFAULT_PLATFORMS, { onConflict: 'name' });

            if (seedError) {
                console.error('Seed error:', seedError);
                return NextResponse.json({ error: 'La tabla "platforms" no existe. Créala en Supabase con: id (uuid), name (text unique), description (text), icon (text), color (text), is_active (bool), created_at (timestamptz).' }, { status: 500 });
            }

            const { data } = await supabaseAdmin.from('platforms').select('*').order('created_at', { ascending: true });
            return NextResponse.json({ platforms: data || [], seeded: true });
        }

        // Normal create
        if (!name || !name.trim()) {
            return NextResponse.json({ error: 'El nombre es obligatorio.' }, { status: 400 });
        }

        // Pick next color from palette
        const { data: existing } = await supabaseAdmin.from('platforms').select('id');
        const idx = (existing?.length || 0) % COLOR_PALETTE.length;

        const { data, error } = await supabaseAdmin
            .from('platforms')
            .insert({
                name: name.trim(),
                description: description?.trim() || `Gestión de ${name.trim().toLowerCase()}.`,
                icon: ICON_PALETTE[idx],
                color: COLOR_PALETTE[idx],
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json({ error: 'Ya existe una plataforma con ese nombre.' }, { status: 400 });
            }
            throw error;
        }

        return NextResponse.json({ platform: data });
    } catch (error: any) {
        console.error('POST /api/admin/platforms error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
