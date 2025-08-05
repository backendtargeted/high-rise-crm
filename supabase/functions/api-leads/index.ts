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
    const leadId = url.pathname.split('/').pop();

    switch (req.method) {
      case 'GET':
        if (leadId && leadId !== 'api-leads') {
          // Get single lead
          const { data, error } = await supabaseClient
            .from('leads')
            .select(`
              *,
              companies (
                name,
                industry,
                website
              )
            `)
            .eq('lead_id', leadId)
            .single();

          if (error) {
            console.error('Error fetching lead:', error);
            return new Response(JSON.stringify({ error: error.message }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          // Get all leads with pagination
          const page = parseInt(url.searchParams.get('page') || '1');
          const limit = parseInt(url.searchParams.get('limit') || '20');
          const search = url.searchParams.get('search') || '';
          
          let query = supabaseClient
            .from('leads')
            .select(`
              *,
              companies (
                name,
                industry,
                website
              )
            `, { count: 'exact' })
            .range((page - 1) * limit, page * limit - 1)
            .order('created_at', { ascending: false });

          if (search) {
            query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
          }

          const { data, error, count } = await query;

          if (error) {
            console.error('Error fetching leads:', error);
            return new Response(JSON.stringify({ error: error.message }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          return new Response(JSON.stringify({
            data,
            pagination: {
              page,
              limit,
              total: count,
              totalPages: Math.ceil((count || 0) / limit)
            }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

      case 'POST':
        const leadData = await req.json();
        
        const { data, error } = await supabaseClient
          .from('leads')
          .insert([leadData])
          .select()
          .single();

        if (error) {
          console.error('Error creating lead:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify(data), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'PUT':
        if (!leadId || leadId === 'api-leads') {
          return new Response('Lead ID required', { status: 400, headers: corsHeaders });
        }

        const updateData = await req.json();
        
        const { data: updatedData, error: updateError } = await supabaseClient
          .from('leads')
          .update(updateData)
          .eq('lead_id', leadId)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating lead:', updateError);
          return new Response(JSON.stringify({ error: updateError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify(updatedData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'DELETE':
        if (!leadId || leadId === 'api-leads') {
          return new Response('Lead ID required', { status: 400, headers: corsHeaders });
        }

        const { error: deleteError } = await supabaseClient
          .from('leads')
          .delete()
          .eq('lead_id', leadId);

        if (deleteError) {
          console.error('Error deleting lead:', deleteError);
          return new Response(JSON.stringify({ error: deleteError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ message: 'Lead deleted successfully' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }
  } catch (error) {
    console.error('Error in api-leads function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});