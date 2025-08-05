-- Phase 1: Foundation & Security
-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_companies ENABLE ROW LEVEL SECURITY;

-- Create a profiles table linked to auth.users for authentication
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id INTEGER UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create function to get current user's role and manager relationships
CREATE OR REPLACE FUNCTION public.get_current_user_data()
RETURNS TABLE(user_id INTEGER, role TEXT, manager_id INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.role, u.manager_id
  FROM public.users u
  JOIN public.profiles p ON p.user_id = u.id
  WHERE p.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create function to check if user can access data (for role-based access)
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- RLS Policies for users table
CREATE POLICY "Users can view accessible user data" ON public.users
  FOR SELECT TO authenticated
  USING (public.can_access_user_data(id));

CREATE POLICY "Admins can insert users" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM public.get_current_user_data() LIMIT 1) = 'admin');

CREATE POLICY "Users can update accessible user data" ON public.users
  FOR UPDATE TO authenticated
  USING (public.can_access_user_data(id));

-- RLS Policies for profiles table
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- RLS Policies for leads table
CREATE POLICY "Users can view accessible leads" ON public.leads
  FOR SELECT TO authenticated
  USING (
    EXISTS(
      SELECT 1 FROM public.applications_tracking at
      WHERE at.lead_id = leads.lead_id
      AND public.can_access_user_data(at.user_id)
    )
    OR (SELECT role FROM public.get_current_user_data() LIMIT 1) = 'admin'
  );

CREATE POLICY "Users can insert leads" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (true); -- Any authenticated user can create leads

CREATE POLICY "Users can update accessible leads" ON public.leads
  FOR UPDATE TO authenticated
  USING (
    EXISTS(
      SELECT 1 FROM public.applications_tracking at
      WHERE at.lead_id = leads.lead_id
      AND public.can_access_user_data(at.user_id)
    )
    OR (SELECT role FROM public.get_current_user_data() LIMIT 1) = 'admin'
  );

-- RLS Policies for companies table
CREATE POLICY "Users can view companies" ON public.companies
  FOR SELECT TO authenticated
  USING (true); -- Companies are generally viewable

CREATE POLICY "Users can insert companies" ON public.companies
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update companies" ON public.companies
  FOR UPDATE TO authenticated
  USING (true);

-- RLS Policies for applications_tracking table
CREATE POLICY "Users can view accessible applications" ON public.applications_tracking
  FOR SELECT TO authenticated
  USING (public.can_access_user_data(user_id));

CREATE POLICY "Users can insert applications for accessible users" ON public.applications_tracking
  FOR INSERT TO authenticated
  WITH CHECK (public.can_access_user_data(user_id));

CREATE POLICY "Users can update accessible applications" ON public.applications_tracking
  FOR UPDATE TO authenticated
  USING (public.can_access_user_data(user_id));

-- RLS Policies for lists table
CREATE POLICY "Users can view lists" ON public.lists
  FOR SELECT TO authenticated
  USING (true); -- Lists are generally viewable

CREATE POLICY "Managers and admins can manage lists" ON public.lists
  FOR ALL TO authenticated
  USING ((SELECT role FROM public.get_current_user_data() LIMIT 1) IN ('manager', 'admin'))
  WITH CHECK ((SELECT role FROM public.get_current_user_data() LIMIT 1) IN ('manager', 'admin'));

-- RLS Policies for list_companies table
CREATE POLICY "Users can view list companies" ON public.list_companies
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Managers and admins can manage list companies" ON public.list_companies
  FOR ALL TO authenticated
  USING ((SELECT role FROM public.get_current_user_data() LIMIT 1) IN ('manager', 'admin'))
  WITH CHECK ((SELECT role FROM public.get_current_user_data() LIMIT 1) IN ('manager', 'admin'));

-- Create trigger function to automatically update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to profiles
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();