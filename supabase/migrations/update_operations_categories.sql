-- Migration to update existing operations category names to match new structure
-- This is optional - only needed if you have existing data with old category names

-- Update "Domain" to "Hosting and Domains"
UPDATE public.operations
SET category = 'Hosting and Domains'
WHERE category = 'Domain';

-- Update "Hosting" to "Hosting and Domains"
UPDATE public.operations
SET category = 'Hosting and Domains'
WHERE category = 'Hosting';

-- Update "WordPress Plugin" to "WordPress Plugins"
UPDATE public.operations
SET category = 'WordPress Plugins'
WHERE category = 'WordPress Plugin';

-- Update "Service" to "Services"
UPDATE public.operations
SET category = 'Services'
WHERE category = 'Service';

