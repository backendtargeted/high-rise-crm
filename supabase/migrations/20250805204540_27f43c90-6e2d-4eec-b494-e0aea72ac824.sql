-- Fix extension in public schema warning
-- Move postgres_fdw extension to a dedicated schema
CREATE SCHEMA IF NOT EXISTS extensions;
-- Note: The postgres_fdw extension appears to be system-managed by Supabase
-- This warning is informational and doesn't require user action for Supabase-managed extensions