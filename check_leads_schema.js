require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('--- LEADS TABLE SCHEMA ---');
    const { data, error } = await supabase.rpc('get_table_info', { table_name: 'leads' });

    // If RPC doesn't exist, try getting one row and inspecting it
    if (error || !data) {
        console.log('RPC failed, fetching one row to inspect...');
        const { data: row } = await supabase.from('leads').select('*').limit(1);
        console.log('Sample Row Keys:', Object.keys(row[0] || {}));
    } else {
        console.table(data);
    }
}

checkSchema();
