-- Update get_current_user_data function to handle case-insensitive email matching
DROP FUNCTION public.get_current_user_data() CASCADE;

CREATE OR REPLACE FUNCTION public.get_current_user_data()
RETURNS TABLE(user_id integer, role character varying, manager_id integer, email character varying)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT u.id, u.role, u.manager_id, u.email
  FROM public.users u
  WHERE LOWER(u.email) = LOWER(auth.email());
END;
$function$;

-- Recreate the RLS policies that were dropped
CREATE POLICY "Admins can insert users" 
ON public.users 
FOR INSERT 
WITH CHECK (( SELECT get_current_user_data.role
   FROM get_current_user_data() get_current_user_data(user_id, role, manager_id, email)
 LIMIT 1) = 'admin'::text);

CREATE POLICY "Users can view accessible leads" 
ON public.leads 
FOR SELECT 
USING (((EXISTS ( SELECT 1
   FROM applications_tracking at
  WHERE ((at.lead_id = leads.lead_id) AND can_access_user_data(at.user_id)))) OR (( SELECT get_current_user_data.role
   FROM get_current_user_data() get_current_user_data(user_id, role, manager_id, email)
 LIMIT 1) = 'admin'::text)));

CREATE POLICY "Users can update accessible leads" 
ON public.leads 
FOR UPDATE 
USING (((EXISTS ( SELECT 1
   FROM applications_tracking at
  WHERE ((at.lead_id = leads.lead_id) AND can_access_user_data(at.user_id)))) OR (( SELECT get_current_user_data.role
   FROM get_current_user_data() get_current_user_data(user_id, role, manager_id, email)
 LIMIT 1) = 'admin'::text)));

CREATE POLICY "Managers and admins can manage lists" 
ON public.lists 
FOR ALL 
USING (( SELECT get_current_user_data.role
   FROM get_current_user_data() get_current_user_data(user_id, role, manager_id, email)
 LIMIT 1) = ANY (ARRAY['manager'::text, 'admin'::text]))
WITH CHECK (( SELECT get_current_user_data.role
   FROM get_current_user_data() get_current_user_data(user_id, role, manager_id, email)
 LIMIT 1) = ANY (ARRAY['manager'::text, 'admin'::text]));

CREATE POLICY "Managers and admins can manage list companies" 
ON public.list_companies 
FOR ALL 
USING (( SELECT get_current_user_data.role
   FROM get_current_user_data() get_current_user_data(user_id, role, manager_id, email)
 LIMIT 1) = ANY (ARRAY['manager'::text, 'admin'::text]))
WITH CHECK (( SELECT get_current_user_data.role
   FROM get_current_user_data() get_current_user_data(user_id, role, manager_id, email)
 LIMIT 1) = ANY (ARRAY['manager'::text, 'admin'::text]));