-- Create function to auto-assign list_id based on company membership
CREATE OR REPLACE FUNCTION auto_assign_list_id()
RETURNS TRIGGER AS $$
DECLARE
  company_list_id INTEGER;
BEGIN
  -- Get the list_id for the company associated with this lead
  SELECT lc.list_id INTO company_list_id
  FROM leads l
  JOIN list_companies lc ON l.company_id = lc.company_id
  WHERE l.lead_id = NEW.lead_id
  LIMIT 1;
  
  -- If a list is found and no list_id is provided, assign it
  IF company_list_id IS NOT NULL AND NEW.list_id IS NULL THEN
    NEW.list_id := company_list_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-assign list_id on application insert
CREATE TRIGGER trigger_auto_assign_list_id
  BEFORE INSERT ON applications_tracking
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_list_id();