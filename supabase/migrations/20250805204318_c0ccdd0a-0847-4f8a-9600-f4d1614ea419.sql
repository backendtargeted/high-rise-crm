-- Phase 2: Core Data Management
-- Add some initial data for testing and development

-- Insert sample companies
INSERT INTO public.companies (name, industry, website) VALUES
('TechCorp Solutions', 'Technology', 'https://techcorp.com'),
('Green Energy Inc', 'Renewable Energy', 'https://greenenergy.com'),
('Healthcare Plus', 'Healthcare', 'https://healthcareplus.com'),
('Financial Services Ltd', 'Finance', 'https://finservices.com'),
('Manufacturing Co', 'Manufacturing', 'https://manufacturing.com')
ON CONFLICT DO NOTHING;

-- Insert sample users (these will be linked to auth users via profiles)
INSERT INTO public.users (fullname, email, role, vicidialuser) VALUES
('John Admin', 'admin@highrisecapital.com', 'admin', 'jadmin'),
('Sarah Manager', 'manager@highrisecapital.com', 'manager', 'smanager'),
('Mike User', 'user@highrisecapital.com', 'user', 'muser'),
('Lisa Sales', 'lisa@highrisecapital.com', 'user', 'lsales')
ON CONFLICT DO NOTHING;

-- Update the second user to have the first user as manager
UPDATE public.users 
SET manager_id = (SELECT id FROM public.users WHERE email = 'admin@highrisecapital.com' LIMIT 1)
WHERE email = 'manager@highrisecapital.com';

-- Update users 3 and 4 to have the manager as their manager
UPDATE public.users 
SET manager_id = (SELECT id FROM public.users WHERE email = 'manager@highrisecapital.com' LIMIT 1)
WHERE email IN ('user@highrisecapital.com', 'lisa@highrisecapital.com');

-- Insert sample leads
INSERT INTO public.leads (company_id, first_name, last_name, email, phone) VALUES
((SELECT company_id FROM public.companies WHERE name = 'TechCorp Solutions' LIMIT 1), 'Robert', 'Johnson', 'robert@techcorp.com', '+1-555-0101'),
((SELECT company_id FROM public.companies WHERE name = 'Green Energy Inc' LIMIT 1), 'Emma', 'Davis', 'emma@greenenergy.com', '+1-555-0102'),
((SELECT company_id FROM public.companies WHERE name = 'Healthcare Plus' LIMIT 1), 'Michael', 'Wilson', 'michael@healthcareplus.com', '+1-555-0103'),
((SELECT company_id FROM public.companies WHERE name = 'Financial Services Ltd' LIMIT 1), 'Jennifer', 'Brown', 'jennifer@finservices.com', '+1-555-0104'),
((SELECT company_id FROM public.companies WHERE name = 'Manufacturing Co' LIMIT 1), 'David', 'Miller', 'david@manufacturing.com', '+1-555-0105')
ON CONFLICT DO NOTHING;

-- Insert sample lists
INSERT INTO public.lists (list_name, list_type, list_provider, initial_lead_count, cost, purchase_date, status) VALUES
('Q1 Technology Prospects', 'technology', 'DataProvider Corp', 500, 2500.00, '2024-01-15', 'active'),
('Healthcare Decision Makers', 'healthcare', 'MedData Solutions', 300, 1800.00, '2024-02-01', 'active'),
('Manufacturing Leaders', 'manufacturing', 'IndustryConnect', 250, 1500.00, '2024-01-20', 'active')
ON CONFLICT DO NOTHING;

-- Insert sample applications tracking
INSERT INTO public.applications_tracking (lead_id, user_id, list_id, application_status, type, date_application_sent) VALUES
((SELECT lead_id FROM public.leads WHERE email = 'robert@techcorp.com' LIMIT 1), 
 (SELECT id FROM public.users WHERE email = 'user@highrisecapital.com' LIMIT 1),
 (SELECT list_id FROM public.lists WHERE list_name = 'Q1 Technology Prospects' LIMIT 1),
 'sent', 'email', '2024-01-25'),
((SELECT lead_id FROM public.leads WHERE email = 'emma@greenenergy.com' LIMIT 1),
 (SELECT id FROM public.users WHERE email = 'lisa@highrisecapital.com' LIMIT 1),
 NULL,
 'created', 'phone', NULL),
((SELECT lead_id FROM public.leads WHERE email = 'michael@healthcareplus.com' LIMIT 1),
 (SELECT id FROM public.users WHERE email = 'user@highrisecapital.com' LIMIT 1),
 (SELECT list_id FROM public.lists WHERE list_name = 'Healthcare Decision Makers' LIMIT 1),
 'responded', 'email', '2024-02-05')
ON CONFLICT DO NOTHING;