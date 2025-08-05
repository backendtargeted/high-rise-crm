-- Drop and recreate the function with email support
DROP FUNCTION public.get_current_user_data();

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