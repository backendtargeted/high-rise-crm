import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Set the auth context
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const url = new URL(req.url);
    const dealId = url.pathname.split('/').pop();

    if (req.method === 'GET') {
      if (dealId && dealId !== 'api-deals') {
        // Get single deal
        const { data, error } = await supabaseClient
          .from('applications_tracking')
          .select(`
            *,
            leads (
              lead_id,
              first_name,
              last_name,
              email,
              phone,
              companies (
                company_id,
                name,
                industry,
                website
              )
            ),
            users (
              id,
              fullname,
              email,
              role
            )
          `)
          .eq('application_id', dealId)
          .single();

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        return new Response(
          JSON.stringify(data),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      } else {
        // Get all deals with pagination and filtering
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const status = url.searchParams.get('status');
        const userId = url.searchParams.get('user_id');
        const listId = url.searchParams.get('list_id');
        const offset = (page - 1) * limit;

        let query = supabaseClient
          .from('applications_tracking')
          .select(`
            *,
            leads (
              lead_id,
              first_name,
              last_name,
              email,
              phone,
              companies (
                company_id,
                name,
                industry,
                website
              )
            ),
            users (
              id,
              fullname,
              email,
              role
            )
          `, { count: 'exact' })
          .range(offset, offset + limit - 1);

        if (status) {
          query = query.eq('application_status', status);
        }
        if (userId) {
          query = query.eq('user_id', userId);
        }
        if (listId) {
          query = query.eq('list_id', listId);
        }

        const { data, error, count } = await query;

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        return new Response(
          JSON.stringify({
            data,
            pagination: {
              page,
              limit,
              total: count,
              totalPages: Math.ceil((count || 0) / limit)
            }
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    if (req.method === 'POST') {
      const body = await req.json();
      
      // Validate required fields
      if (!body.lead_id && !body.lead_email && !body.lead_phone) {
        return new Response(
          JSON.stringify({ error: 'Either lead_id, lead_email, or lead_phone is required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      let leadId = body.lead_id;

      // If lead_id not provided, try to find by email or phone
      if (!leadId && (body.lead_email || body.lead_phone)) {
        let leadQuery = supabaseClient.from('leads').select('lead_id');
        
        if (body.lead_email) {
          leadQuery = leadQuery.eq('email', body.lead_email);
        } else if (body.lead_phone) {
          leadQuery = leadQuery.eq('phone', body.lead_phone);
        }

        const { data: leadData, error: leadError } = await leadQuery.single();
        
        if (leadError || !leadData) {
          return new Response(
            JSON.stringify({ error: 'Lead not found with provided email/phone' }),
            { 
              status: 404, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
        
        leadId = leadData.lead_id;
      }

      // Find user_id if vicidialuser provided
      let userId = body.user_id;
      if (!userId && body.vicidialuser) {
        const { data: userData, error: userError } = await supabaseClient
          .from('users')
          .select('id')
          .eq('vicidialuser', body.vicidialuser)
          .single();

        if (userError || !userData) {
          return new Response(
            JSON.stringify({ error: 'User not found with provided vicidialuser' }),
            { 
              status: 404, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        userId = userData.id;
      }

      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'Either user_id or vicidialuser is required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const { data, error } = await supabaseClient
        .from('applications_tracking')
        .insert({
          lead_id: leadId,
          user_id: userId,
          application_status: body.application_status || 'created',
          type: body.type,
          list_id: body.list_id,
          date_application_sent: body.date_application_sent,
          opensign_objectid: body.opensign_objectid
        })
        .select(`
          *,
          leads (
            lead_id,
            first_name,
            last_name,
            email,
            phone,
            companies (
              company_id,
              name,
              industry,
              website
            )
          ),
          users (
            id,
            fullname,
            email,
            role
          )
        `)
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify(data),
        { 
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (req.method === 'PUT') {
      if (!dealId || dealId === 'api-deals') {
        return new Response(
          JSON.stringify({ error: 'Deal ID is required for updates' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const body = await req.json();
      
      const updateData: any = {};
      if (body.application_status) updateData.application_status = body.application_status;
      if (body.type) updateData.type = body.type;
      if (body.list_id) updateData.list_id = body.list_id;
      if (body.date_application_sent) updateData.date_application_sent = body.date_application_sent;
      if (body.date_signed) updateData.date_signed = body.date_signed;
      if (body.opensign_objectid) updateData.opensign_objectid = body.opensign_objectid;

      const { data, error } = await supabaseClient
        .from('applications_tracking')
        .update(updateData)
        .eq('application_id', dealId)
        .select(`
          *,
          leads (
            lead_id,
            first_name,
            last_name,
            email,
            phone,
            companies (
              company_id,
              name,
              industry,
              website
            )
          ),
          users (
            id,
            fullname,
            email,
            role
          )
        `)
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify(data),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})