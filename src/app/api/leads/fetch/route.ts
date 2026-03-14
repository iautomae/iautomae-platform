import { NextResponse } from 'next/server';
import { getProfileById, getSupabaseAdminClient, requireAuth } from '@/lib/server-auth';

const supabaseAdmin = getSupabaseAdminClient();

type LeadRow = {
    id: string;
    [key: string]: unknown;
};

// Helper: apply visibility OR filter to a query builder
function applyVisibility(query: any, orFilter: string | null) {
    return orFilter ? query.or(orFilter) : query;
}

// Helper: build the OR clause for advisor visibility
function buildOrFilter(visibleProfileIds: string[], visibleAdvisorNames: string[]): string | null {
    const clauses: string[] = [];
    if (visibleProfileIds.length > 0) {
        clauses.push(`assigned_profile_id.in.(${visibleProfileIds.join(',')})`);
    }
    if (visibleAdvisorNames.length > 0) {
        clauses.push(`advisor_name.in.(${visibleAdvisorNames.join(',')})`);
    }
    return clauses.length > 0 ? clauses.join(',') : null;
}

const ESTADO_VALUES = ['Sin respuesta', 'En seguimiento', 'Compromiso de pago', 'Pagado', 'Descartado'];

export async function GET(request: Request) {
    try {
        const { context, response } = await requireAuth(request, ['admin', 'tenant_owner', 'client']);
        if (response || !context) {
            return response!;
        }

        const url = new URL(request.url);
        const agentId = url.searchParams.get('agent_id');

        if (!agentId) {
            return NextResponse.json({ error: 'agent_id es requerido.' }, { status: 400 });
        }

        // Pagination params
        const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
        const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('page_size') || '15', 10)));
        const statusFilter = url.searchParams.get('status') || 'ALL'; // ALL, POTENCIAL, NO_POTENCIAL
        const estadoFilter = url.searchParams.get('estado') || null;
        const calendarOnly = url.searchParams.get('calendar_only') === 'true';

        const { data: agent, error: agentError } = await supabaseAdmin
            .from('agentes')
            .select('id, user_id, pushover_user_1_profile_id, pushover_user_2_profile_id, pushover_user_3_profile_id, pushover_user_1_name, pushover_user_2_name, pushover_user_3_name')
            .eq('id', agentId)
            .single();

        if (agentError || !agent) {
            return NextResponse.json({ error: 'Agente no encontrado.' }, { status: 404 });
        }

        const profile = context.profile;
        const { data: agentOwner, error: agentOwnerError } = await getProfileById(agent.user_id);

        if (agentOwnerError || !agentOwner) {
            return NextResponse.json({ error: 'No se pudo validar el propietario del agente.' }, { status: 403 });
        }

        const isSameTenantAgent =
            !!profile.tenant_id &&
            !!agentOwner.tenant_id &&
            profile.tenant_id === agentOwner.tenant_id;
        const isAdminOwnedAgent = agentOwner.role === 'admin';

        if (profile.role !== 'admin' && !isSameTenantAgent && !isAdminOwnedAgent) {
            return NextResponse.json({ error: 'No puedes consultar leads de otro tenant.' }, { status: 403 });
        }

        // --- Resolve visibility ---
        let orFilter: string | null = null; // null = show all leads

        const viewAsUid = url.searchParams.get('view_as');
        let effectiveFeatures = profile.features || {};

        if (profile.role === 'admin' && viewAsUid) {
            const { data: viewAsProfile } = await getProfileById(viewAsUid);
            if (viewAsProfile && viewAsProfile.role === 'client') {
                effectiveFeatures = viewAsProfile.features || {};
            }
            // else: viewing as tenant_owner — orFilter stays null (show all)
        } else if (profile.role === 'admin' || profile.role === 'tenant_owner') {
            // orFilter stays null — show all
        } else {
            // Client role — check visibility
            const visibility = effectiveFeatures.leads_visible_advisors || 'all';
            if (visibility !== 'all') {
                const slots = Array.isArray(visibility) ? visibility : [];
                const visibleProfileIds: string[] = [];
                const visibleAdvisorNames: string[] = [];
                for (const slot of slots) {
                    const slotNum = typeof slot === 'string' ? parseInt(slot, 10) : slot;
                    if (![1, 2, 3].includes(slotNum)) continue;
                    const profileId = slotNum === 1 ? agent.pushover_user_1_profile_id
                        : slotNum === 2 ? agent.pushover_user_2_profile_id
                        : slotNum === 3 ? agent.pushover_user_3_profile_id
                        : null;
                    if (profileId) visibleProfileIds.push(profileId);
                    const advisorName = slotNum === 1 ? agent.pushover_user_1_name
                        : slotNum === 2 ? agent.pushover_user_2_name
                        : slotNum === 3 ? agent.pushover_user_3_name
                        : null;
                    if (advisorName) visibleAdvisorNames.push(advisorName);
                }
                if (visibleProfileIds.length === 0 && visibleAdvisorNames.length === 0) {
                    return NextResponse.json({
                        leads: [], total: 0, page, page_size: pageSize, total_pages: 0,
                        counts: { all: 0, potencial: 0, no_potencial: 0, estados: Object.fromEntries(ESTADO_VALUES.map(e => [e, 0])) }
                    });
                }
                orFilter = buildOrFilter(visibleProfileIds, visibleAdvisorNames);
            }
        }

        // Also handle the client + view_as resolved visibility
        if (profile.role === 'admin' && viewAsUid) {
            const visibility = effectiveFeatures.leads_visible_advisors || 'all';
            if (visibility !== 'all') {
                const slots = Array.isArray(visibility) ? visibility : [];
                const visibleProfileIds: string[] = [];
                const visibleAdvisorNames: string[] = [];
                for (const slot of slots) {
                    const slotNum = typeof slot === 'string' ? parseInt(slot, 10) : slot;
                    if (![1, 2, 3].includes(slotNum)) continue;
                    const profileId = slotNum === 1 ? agent.pushover_user_1_profile_id
                        : slotNum === 2 ? agent.pushover_user_2_profile_id
                        : slotNum === 3 ? agent.pushover_user_3_profile_id
                        : null;
                    if (profileId) visibleProfileIds.push(profileId);
                    const advisorName = slotNum === 1 ? agent.pushover_user_1_name
                        : slotNum === 2 ? agent.pushover_user_2_name
                        : slotNum === 3 ? agent.pushover_user_3_name
                        : null;
                    if (advisorName) visibleAdvisorNames.push(advisorName);
                }
                if (visibleProfileIds.length === 0 && visibleAdvisorNames.length === 0) {
                    return NextResponse.json({
                        leads: [], total: 0, page, page_size: pageSize, total_pages: 0,
                        counts: { all: 0, potencial: 0, no_potencial: 0, estados: Object.fromEntries(ESTADO_VALUES.map(e => [e, 0])) }
                    });
                }
                orFilter = buildOrFilter(visibleProfileIds, visibleAdvisorNames);
            }
        }

        // --- Calendar-only mode ---
        if (calendarOnly) {
            let q = supabaseAdmin
                .from('leads')
                .select('*')
                .eq('agent_id', agentId)
                .not('fecha_seguimiento', 'is', null)
                .order('fecha_seguimiento', { ascending: true })
                .range(0, 999);
            q = applyVisibility(q, orFilter);
            const { data, error } = await q;
            if (error) throw error;
            return NextResponse.json({ calendar_leads: data || [] });
        }

        // --- Build count queries (parallel) ---
        const buildCountQuery = (extraFilters?: { status?: string; estado?: string }) => {
            let q = supabaseAdmin
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('agent_id', agentId);
            q = applyVisibility(q, orFilter);
            if (extraFilters?.status) q = q.eq('status', extraFilters.status);
            if (extraFilters?.estado) q = q.eq('estado', extraFilters.estado);
            return q;
        };

        const countPromises = [
            buildCountQuery(),                                    // all
            buildCountQuery({ status: 'POTENCIAL' }),            // potencial
            buildCountQuery({ status: 'NO_POTENCIAL' }),         // no_potencial
            ...ESTADO_VALUES.map(e => buildCountQuery({ status: 'POTENCIAL', estado: e })), // each estado (only for potencial)
        ];

        // --- Build data query ---
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let dataQuery = supabaseAdmin
            .from('leads')
            .select('*')
            .eq('agent_id', agentId);
        dataQuery = applyVisibility(dataQuery, orFilter);
        if (statusFilter === 'POTENCIAL') dataQuery = dataQuery.eq('status', 'POTENCIAL');
        if (statusFilter === 'NO_POTENCIAL') dataQuery = dataQuery.eq('status', 'NO_POTENCIAL');
        if (estadoFilter) dataQuery = dataQuery.eq('estado', estadoFilter);
        dataQuery = dataQuery.order('created_at', { ascending: false }).range(from, to);

        // Also get the count for the current filter combination
        let filteredCountQuery = supabaseAdmin
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('agent_id', agentId);
        filteredCountQuery = applyVisibility(filteredCountQuery, orFilter);
        if (statusFilter === 'POTENCIAL') filteredCountQuery = filteredCountQuery.eq('status', 'POTENCIAL');
        if (statusFilter === 'NO_POTENCIAL') filteredCountQuery = filteredCountQuery.eq('status', 'NO_POTENCIAL');
        if (estadoFilter) filteredCountQuery = filteredCountQuery.eq('estado', estadoFilter);

        // Execute all in parallel
        const [countResults, dataResult, filteredCountResult] = await Promise.all([
            Promise.all(countPromises),
            dataQuery,
            filteredCountQuery,
        ]);

        if (dataResult.error) throw dataResult.error;
        if (filteredCountResult.error) throw filteredCountResult.error;

        const totalFiltered = filteredCountResult.count || 0;
        const totalPages = Math.ceil(totalFiltered / pageSize);

        const counts = {
            all: countResults[0].count || 0,
            potencial: countResults[1].count || 0,
            no_potencial: countResults[2].count || 0,
            estados: Object.fromEntries(ESTADO_VALUES.map((e, i) => [e, countResults[3 + i].count || 0])),
        };

        return NextResponse.json({
            leads: dataResult.data || [],
            total: totalFiltered,
            page,
            page_size: pageSize,
            total_pages: totalPages,
            counts,
        });
    } catch (error: unknown) {
        console.error('Error fetching leads:', error);
        return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
    }
}
