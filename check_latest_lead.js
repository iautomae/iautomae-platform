require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLatestLead() {
    console.log('Buscando el lead más reciente...');
    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Error al consultar:', error.message);
    } else if (data && data.length > 0) {
        const lead = data[0];
        console.log('--------------------------------------------------');
        console.log('✅ ÚLTIMO LEAD ENCONTRADO:');
        console.log(`🆔 ID: ${lead.id}`);
        console.log(`📅 Fecha: ${new Date(lead.created_at).toLocaleString()}`);
        console.log(`👤 Nombre: ${lead.nombre || lead.name}`);
        console.log(`📞 Teléfono: ${lead.phone}`);
        console.log(`📝 Resumen: ${lead.summary}`);
        console.log('--------------------------------------------------');
    } else {
        console.log('📭 No se encontraron leads todavía.');
    }
}

checkLatestLead();
