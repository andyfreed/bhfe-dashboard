-- Migration: Remove personal/company distinction from todos
-- All todos are now treated as company todos

-- Set all existing todos to be company todos
UPDATE public.todos
SET is_company_task = true
WHERE is_company_task = false;

-- Note: The is_company_task field is kept in the schema for backward compatibility
-- but all todos will have it set to true going forward.

