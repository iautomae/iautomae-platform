import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        if (!supabaseServiceKey) {
            return NextResponse.json({ error: "Missing Service Role Key" }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Fetch all agents with their user_id to count them per user
        // We use user_id because it correlates with the profile.id
        const { data, error } = await supabase
            .from('agentes')
            .select('user_id');

        if (error) throw error;

        const counts: Record<string, number> = {};
        data.forEach(agent => {
            const uid = agent.user_id;
            if (uid) counts[uid] = (counts[uid] || 0) + 1;
        });

        return NextResponse.json({ counts });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
