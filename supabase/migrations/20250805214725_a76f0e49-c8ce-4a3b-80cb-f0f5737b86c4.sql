-- Update the get_current_user_data function to use email
CREATE OR REPLACE FUNCTION public.get_current_user_data()
RETURNS TABLE(user_id integer, role text, manager_id integer, email text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT u.id, u.role, u.manager_id, u.email
  FROM public.users u
  WHERE u.email = auth.email();
END;
$function$;