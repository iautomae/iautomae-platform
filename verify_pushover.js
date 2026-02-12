const { createClient } = require('@supabase/supabase-js');

// Hardcoding for debugging purposes as dotenv seems to have issues in this specific execution context
const supabaseUrl = 'https://spuwnpwzboytmywfyyxr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwdXducHd6Ym95dG15d2Z5eXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzMTc2MDYsImV4cCI6MjA4NDg5MzYwNn0.REGztCeY1JzsmRBk5-Vb6HuBGrA5J5HX7iCl4ySChNk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Querying Supabase...');
    const { data, error } = await supabase
        .from('agentes')
        .select('*')
        .limit(5);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Agents found:', data.length);
        console.log(JSON.stringify(data.map(a => ({
            nombre: a.nombre,
            pushover_user_key: a.pushover_user_key,
            pushover_api_token: a.pushover_api_token,
            make_webhook_url: a.make_webhook_url
        })), null, 2));
    }
}

check();
