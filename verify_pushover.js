const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: faltan variables de entorno de Supabase. Usa Doppler para inyectarlas.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const requestedAgent = (process.argv[2] || '').trim().toLowerCase();

function mask(value) {
    if (!value || typeof value !== 'string') return null;
    if (value.length <= 8) return `${value.slice(0, 2)}***`;
    return `${value.slice(0, 4)}***${value.slice(-3)}`;
}

function isEligible(filter, leadStatus) {
    const effectiveFilter = filter || 'ALL';
    if (effectiveFilter === 'ALL') return true;
    if (effectiveFilter === 'POTENTIAL_ONLY' && leadStatus === 'POTENCIAL') return true;
    if (effectiveFilter === 'NO_POTENTIAL_ONLY' && leadStatus === 'NO_POTENCIAL') return true;
    return false;
}

function summarizeAdvisor(agent, slot) {
    const prefix = `pushover_user_${slot}_`;
    const key = agent[`${prefix}key`];
    const token = agent[`${prefix}token`];
    const active = agent[`${prefix}active`] ?? true;
    const filter = agent[`${prefix}notification_filter`] || agent.pushover_notification_filter || 'ALL';
    const hasCreds = !!(key && key.trim() && token && token.trim());

    return {
        slot,
        name: agent[`${prefix}name`] || `Asesor ${slot}`,
        active,
        filter,
        profile_id: agent[`${prefix}profile_id`] || null,
        has_key: !!(key && key.trim()),
        has_token: !!(token && token.trim()),
        masked_key: mask(key),
        masked_token: mask(token),
        eligible_for_potencial: active && hasCreds && isEligible(filter, 'POTENCIAL'),
        eligible_for_no_potencial: active && hasCreds && isEligible(filter, 'NO_POTENCIAL'),
    };
}

async function main() {
    console.log('Consultando configuracion Pushover actual...');

    let query = supabase
        .from('agentes')
        .select(`
            id,
            nombre,
            status,
            pushover_notification_filter,
            pushover_user_1_name, pushover_user_1_key, pushover_user_1_token, pushover_user_1_active, pushover_user_1_notification_filter, pushover_user_1_profile_id,
            pushover_user_2_name, pushover_user_2_key, pushover_user_2_token, pushover_user_2_active, pushover_user_2_notification_filter, pushover_user_2_profile_id,
            pushover_user_3_name, pushover_user_3_key, pushover_user_3_token, pushover_user_3_active, pushover_user_3_notification_filter, pushover_user_3_profile_id
        `)
        .order('created_at', { ascending: true });

    if (requestedAgent) {
        query = query.ilike('nombre', `%${requestedAgent}%`);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error consultando agentes:', error);
        process.exit(1);
    }

    if (!data || data.length === 0) {
        console.log('No se encontraron agentes para revisar.');
        return;
    }

    const report = data.map((agent) => {
        const advisors = [1, 2, 3].map((slot) => summarizeAdvisor(agent, slot));
        return {
            agent_id: agent.id,
            agent_name: agent.nombre,
            agent_status: agent.status,
            global_filter: agent.pushover_notification_filter || 'ALL',
            advisors,
        };
    });

    console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
    console.error('Fallo inesperado verificando Pushover:', err);
    process.exit(1);
});
