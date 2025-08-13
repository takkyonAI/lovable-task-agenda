-- Simple Migration Script - Apply Only
-- This script will check and apply the migration without testing data insertion

-- Step 1: Check current column type
SELECT 
    table_name,
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tasks' 
  AND column_name = 'due_date';

-- Step 2: Apply the migration
-- Change the due_date column type from DATE to TIMESTAMP WITH TIME ZONE
ALTER TABLE public.tasks 
ALTER COLUMN due_date TYPE TIMESTAMP WITH TIME ZONE USING 
  CASE 
    WHEN due_date IS NULL THEN NULL
    ELSE due_date::TIMESTAMP WITH TIME ZONE
  END;

-- Ensure the column allows NULL values
ALTER TABLE public.tasks 
ALTER COLUMN due_date DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN public.tasks.due_date IS 
'Changed from DATE to TIMESTAMP WITH TIME ZONE to properly store date and time information without timezone conversion issues';

-- Step 3: Verify the change was applied successfully
SELECT 
    table_name,
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tasks' 
  AND column_name = 'due_date';

-- Success message
SELECT 'Migration applied successfully! Column due_date is now TIMESTAMP WITH TIME ZONE' as result; 