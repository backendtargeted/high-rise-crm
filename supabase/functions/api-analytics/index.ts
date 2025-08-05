import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    const url = new URL(req.url);
    const endpoint = url.pathname.split('/').pop();

    switch (endpoint) {
      case 'dashboard':
        // Get dashboard analytics
        const [
          leadsResult,
          applicationsResult,
          companiesResult,
          statusDistribution,
          monthlyTrends
        ] = await Promise.all([
          supabaseClient.from('leads').select('*', { count: 'exact', head: true }),
          supabaseClient.from('applications_tracking').select('*', { count: 'exact', head: true }),
          supabaseClient.from('companies').select('*', { count: 'exact', head: true }),
          supabaseClient
            .from('applications_tracking')
            .select('application_status')
            .then(({ data }) => {
              const counts = data?.reduce((acc, app) => {
                acc[app.application_status] = (acc[app.application_status] || 0) + 1;
                return acc;
              }, {});
              return Object.entries(counts || {}).map(([status, count]) => ({
                status,
                count
              }));
            }),
          supabaseClient
            .from('applications_tracking')
            .select('created_at')
            .gte('created_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())
            .then(({ data }) => {
              const monthlyData = data?.reduce((acc, app) => {
                const month = new Date(app.created_at).toISOString().substring(0, 7);
                acc[month] = (acc[month] || 0) + 1;
                return acc;
              }, {});
              return Object.entries(monthlyData || {}).map(([month, count]) => ({
                month,
                applications: count
              }));
            })
        ]);

        const totalLeads = leadsResult.count || 0;
        const totalApplications = applicationsResult.count || 0;
        const totalCompanies = companiesResult.count || 0;
        const conversionRate = totalLeads > 0 ? (totalApplications / totalLeads) * 100 : 0;

        return new Response(JSON.stringify({
          summary: {
            totalLeads,
            totalApplications,
            totalCompanies,
            conversionRate: parseFloat(conversionRate.toFixed(2))
          },
          statusDistribution,
          monthlyTrends
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'performance':
        // Get user performance analytics
        const { data: userPerformance } = await supabaseClient
          .from('applications_tracking')
          .select(`
            user_id,
            application_status,
            users!inner(fullname)
          `);

        const performanceData = userPerformance?.reduce((acc, app) => {
          const userId = app.user_id;
          if (!acc[userId]) {
            acc[userId] = {
              name: app.users.fullname,
              total: 0,
              sent: 0,
              responded: 0,
              signed: 0
            };
          }
          acc[userId].total++;
          if (app.application_status === 'sent') acc[userId].sent++;
          if (app.application_status === 'responded') acc[userId].responded++;
          if (app.application_status === 'signed') acc[userId].signed++;
          return acc;
        }, {});

        return new Response(JSON.stringify(
          Object.values(performanceData || {})
        ), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'export':
        // Export data as CSV
        const { data: exportData } = await supabaseClient
          .from('applications_tracking')
          .select(`
            *,
            leads(first_name, last_name, email, companies(name)),
            users(fullname)
          `);

        const csvHeaders = [
          'Application ID',
          'Lead Name',
          'Lead Email',
          'Company',
          'User',
          'Status',
          'Type',
          'Date Sent',
          'Created At'
        ];

        const csvRows = exportData?.map(app => [
          app.application_id,
          `${app.leads?.first_name} ${app.leads?.last_name}`,
          app.leads?.email || '',
          app.leads?.companies?.name || '',
          app.users?.fullname || '',
          app.application_status,
          app.type,
          app.date_application_sent || '',
          app.created_at
        ]) || [];

        const csv = [csvHeaders, ...csvRows]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n');

        return new Response(csv, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="crm-export.csv"'
          },
        });

      default:
        return new Response('Endpoint not found', { status: 404, headers: corsHeaders });
    }
  } catch (error) {
    console.error('Error in api-analytics function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});