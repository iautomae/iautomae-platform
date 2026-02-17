require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Must use service role to bypass policies if needed

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetTokens() {
    console.log('🔄 Resetting all token counts to 0...');

    const { data, error, count } = await supabase
        .from('leads')
        .update({
            tokens_billed: 0,
            tokens_raw: 0
        })
        .neq('id', -1) // Basic filter to target all rows (or use a valid condition if needed)
        .select('id');

    if (error) {
        console.error('❌ Error resetting tokens:', error);
    } else {
        console.log(`✅ Successfully reset tokens for ${data.length} leads.`);
    }
}

resetTokens();
