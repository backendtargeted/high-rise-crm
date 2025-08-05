-- Fix security warnings by setting search_path for functions
CREATE OR REPLACE FUNCTION public.get_current_user_data()
RETURNS TABLE(user_id INTEGER, role TEXT, manager_id INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.role, u.manager_id
  FROM public.users u
  JOIN public.profiles p ON p.user_id = u.id
  WHERE p.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

-- Fix search_path for can_access_user_data function
CREATE OR REPLACE FUNCTION public.can_access_user_data(target_user_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_data RECORD;
  is_manager BOOLEAN := FALSE;
BEGIN
  -- Get current user's data
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

-- Fix search_path for update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';