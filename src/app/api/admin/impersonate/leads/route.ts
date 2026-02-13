
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const targetUid = searchParams.get('user_id');
        const agentId = searchParams.get('agent_id');

        if (!targetUid || !agentId) {
            return NextResponse.json({ error: "Missing user_id or agent_id" }, { status: 400 });
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

        // Check role in profiles table
        const { data: profile, error: profileErr } = await clientSupabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileErr || profile?.role !== 'admin') {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        // 2. If Admin, fetch leads using Service Role Key
        const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: leads, error: leadsErr } = await adminSupabase
            .from('leads')
            .select('*')
            .eq('agent_id', agentId)
            .eq('user_id', targetUid)
            .order('created_at', { ascending: false });

        if (leadsErr) throw leadsErr;

        return NextResponse.json({ leads });

    } catch (error: unknown) {
        console.error('Error in impersonation leads fetch:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
    }
}
