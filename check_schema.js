
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
    console.log('Checking schema for tables public.agentes and public.leads...');

    const { data: agentesCols, error: agentesError } = await supabase.rpc('get_table_columns_v2', { t_name: 'agentes' }) ||
        await supabase.from('agentes').select('*').limit(1);

    if (agentesError) {
        console.log('Falling back to direct select for agentes');
        const { data, error } = await supabase.from('agentes').select('*').limit(1);
        if (!error && data.length > 0) {
            console.log('Agentes columns:', Object.keys(data[0]));
        } else {
            console.error('Error fetching agentes:', error);
        }
    }

    const { data: leadsCols, error: leadsError } = await supabase.from('leads').select('*').limit(1);
    if (!leadsError && leadsCols.length > 0) {
        console.log('Leads columns:', Object.keys(leadsCols[0]));
    } else {
        console.error('Error fetching leads:', leadsError);
    }
}

checkSchema();
