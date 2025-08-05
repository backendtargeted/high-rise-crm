-- Disable email confirmation requirement for authentication
UPDATE auth.config SET email_confirm_required = false;