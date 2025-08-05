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
$function$

-- Update can_access_user_data function to work with email
CREATE OR REPLACE FUNCTION public.can_access_user_data(target_user_id integer)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  current_user_data RECORD;
  is_manager BOOLEAN := FALSE;
BEGIN
  -- Get current user's data by email
  SELECT * INTO current_user_data FROM public.get_current_user_data() LIMIT 1;
  
  -- If no user data found, deny access
  IF current_user_data IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Admin role has access to everything
  IF current_user_data.role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Users can access their own data
  IF current_user_data.user_id = target_user_id THEN
    RETURN TRUE;
  END IF;
  
  -- Managers can access their team's data
  IF current_user_data.role = 'manager' THEN
    SELECT EXISTS(
      SELECT 1 FROM public.users 
      WHERE id = target_user_id AND manager_id = current_user_data.user_id
    ) INTO is_manager;
    
    IF is_manager THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  RETURN FALSE;
END;
$function$