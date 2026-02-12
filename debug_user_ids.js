require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: agents, error } = await supabase
        .from('agentes')
        .select('nombre, id, user_id, eleven_labs_agent_id');

    if (error) console.error(error);

    console.log(JSON.stringify(agents, null, 2));
}

check();
