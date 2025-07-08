-- Migration: Fix due_date timezone issue
-- This changes the due_date column from DATE to TIMESTAMP to properly store date and time
-- Date: 2025-01-08

-- Change the due_date column type from DATE to TIMESTAMP WITH TIME ZONE
-- This allows storing both date and time correctly with proper timezone handling
ALTER TABLE public.tasks 
ALTER COLUMN due_date TYPE TIMESTAMP WITH TIME ZONE USING 
  CASE 
    WHEN due_date IS NULL THEN NULL
    ELSE due_date::TIMESTAMP WITH TIME ZONE
  END;

-- Update the column to allow NULL values (if not already)
ALTER TABLE public.tasks 
ALTER COLUMN due_date DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN public.tasks.due_date IS 
'Changed from DATE to TIMESTAMP to properly store date and time information without timezone conversion issues. Format: YYYY-MM-DD HH:MM:SS'; 