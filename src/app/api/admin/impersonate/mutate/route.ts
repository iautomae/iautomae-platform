
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, targetUid, agentId, data } = body;

        if (!action || !targetUid) {
            return NextResponse.json({ error: "Missing action or targetUid" }, { status: 400 });
        }

        // 1. Verify that the requester is an Admin
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const clientSupabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        });

        const { data: { user }, error: authError } = await clientSupabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Invalid session" }, { status: 401 });
        }

        const { data: profile } = await clientSupabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        // 2. Perform Mutation using Service Role Key
        const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

        if (action === 'TOGGLE_AGENT_STATUS') {
            if (!agentId || !data.status) return NextResponse.json({ error: "Missing data" }, { status: 400 });
            const { error } = await adminSupabase
                .from('agentes')
                .update({ status: data.status })
                .eq('id', agentId)
                .eq('user_id', targetUid);
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        if (action === 'DELETE_AGENT') {
            if (!agentId) return NextResponse.json({ error: "Missing agentId" }, { status: 400 });

            // Delete leads first
            await adminSupabase.from('leads').delete().eq('agent_id', agentId).eq('user_id', targetUid);

            const { error } = await adminSupabase
                .from('agentes')
                .delete()
                .eq('id', agentId)
                .eq('user_id', targetUid);
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        if (action === 'SAVE_AGENT_CONFIG') {
            if (!agentId || !data) return NextResponse.json({ error: "Missing data" }, { status: 400 });
            console.log(`Saving config for agent ${agentId}, user ${targetUid}`);
            const { error } = await adminSupabase
                .from('agentes')
                .update(data)
                .eq('id', agentId)
                .eq('user_id', targetUid);
            if (error) {
                console.error('Supabase update error:', error);
                throw error;
            }
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error: unknown) {
        console.error('Error in impersonation mutation:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
    }
}
