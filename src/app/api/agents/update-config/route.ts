
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const body = await request.json();
        const { agentId, config } = body;

        if (!agentId || !config) {
            return NextResponse.json({ error: 'Missing agentId or config data' }, { status: 400 });
        }

        console.log(`Updating config for agent ${agentId}...`);

        const { data: updatedAgent, error: updateError } = await supabase
            .from('agentes')
            .update({
                pushover_user_key: config.pushover_user_key || null,
                pushover_user_key_2: config.pushover_user_key_2 || null,
                pushover_user_key_3: config.pushover_user_key_3 || null,
                pushover_api_token: config.pushover_api_token || null,
                pushover_template: config.pushover_template || null,
                pushover_notification_filter: config.pushover_notification_filter || 'ALL',
                pushover_title: config.pushover_title || null,
                make_webhook_url: config.make_webhook_url || null
            })
            .eq('id', agentId)
            .select()
            .single();

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, agent: updatedAgent });

    } catch (error: unknown) {
        console.error('Error updating agent config:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
