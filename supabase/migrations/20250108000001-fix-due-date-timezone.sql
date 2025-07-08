-- Migration: Fix due_date timezone issue
-- This changes the due_date column from DATE to TIMESTAMP to properly store date and time
-- Date: 2025-01-08

-- Change the due_date column type from DATE to TIMESTAMP
-- This allows storing both date and time correctly without timezone conversion issues
ALTER TABLE public.tasks 
ALTER COLUMN due_date TYPE TIMESTAMP USING due_date::TIMESTAMP;

-- Add comment explaining the change
COMMENT ON COLUMN public.tasks.due_date IS 
'Changed from DATE to TIMESTAMP to properly store date and time information without timezone conversion issues'; 