-- Fix the function to have a secure search path
CREATE OR REPLACE FUNCTION auto_assign_list_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  company_list_id INTEGER;
BEGIN
  -- Get the list_id for the company associated with this lead
  SELECT lc.list_id INTO company_list_id
  FROM public.leads l
  JOIN public.list_companies lc ON l.company_id = lc.company_id
  WHERE l.lead_id = NEW.lead_id
  LIMIT 1;
  
  -- If a list is found and no list_id is provided, assign it
  IF company_list_id IS NOT NULL AND NEW.list_id IS NULL THEN
    NEW.list_id := company_list_id;
  END IF;
  
  RETURN NEW;
END;
$$;