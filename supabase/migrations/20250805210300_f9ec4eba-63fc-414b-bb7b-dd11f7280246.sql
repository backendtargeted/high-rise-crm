-- Insert test users into the users table
INSERT INTO public.users (fullname, email, role, vicidialuser) VALUES
('John Admin', 'admin@highrisecapital.com', 'admin', 'Agent35'),
('David Zellman', 'David@highrisecapital.org', 'manager', 'Agent5'),
('trainee131', 'user@highrisecapital.com', 'user', 'Agent40'),
('Brandon Chabez', 'brandonc@highrisecapital.org', 'user', 'Agent21')
ON CONFLICT (email) DO NOTHING;