
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const body = await request.json();
        const {
            leadId,
            advisorName,
            name,
            status,
            estado,
            notas_seguimiento,
            fecha_seguimiento
        } = body;

        if (!leadId) {
            return NextResponse.json({ error: 'Missing leadId' }, { status: 400 });
        }

        const updateData: any = {};
        if (advisorName !== undefined) updateData.advisor_name = advisorName || null;
        if (name !== undefined) updateData.nombre = name;
        if (status !== undefined) updateData.status = status;
        if (estado !== undefined) updateData.estado = estado;
        if (notas_seguimiento !== undefined) updateData.notas_seguimiento = notas_seguimiento;
        if (fecha_seguimiento !== undefined) updateData.fecha_seguimiento = fecha_seguimiento || null;

        const { data: updatedLead, error: updateError } = await supabase
            .from('leads')
            .update(updateData)
            .eq('id', leadId)
            .select()
            .single();

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, lead: updatedLead });

    } catch (error: unknown) {
        console.error('Error updating lead:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
