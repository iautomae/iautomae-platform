require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function readBlackBox() {
    console.log('--- READING BLACK BOX ERROR LOGS ---');

    const { data: debugAgent, error } = await supabase
        .from('agentes')
        .select('nombre, prompt')
        .eq('nombre', 'DEBUG_Fallback')
        .single();

    if (error) {
        console.error('Error fetching debug agent:', error);
        return;
    }

    if (debugAgent && debugAgent.prompt) {
        console.log('\nLAST RECORDED ERROR:');
        console.log(debugAgent.prompt);
    } else {
        console.log('No errors recorded in the black box yet.');
    }
}

readBlackBox();
