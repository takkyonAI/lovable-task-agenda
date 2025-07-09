-- Enable realtime for tasks table
-- This ensures that real-time subscriptions work properly

-- First, make sure the table has realtime enabled
BEGIN;

-- Add the table to realtime publication if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM realtime.subscription 
    WHERE entity = 'tasks' AND schemaname = 'public'
  ) THEN
    -- Enable realtime for tasks table
    INSERT INTO realtime.subscription (entity, schemaname, claims)
    VALUES ('tasks', 'public', '{}');
    
    RAISE NOTICE 'Realtime enabled for tasks table';
  ELSE
    RAISE NOTICE 'Realtime already enabled for tasks table';
  END IF;
END $$;

-- Also ensure the table is part of the supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'tasks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
    RAISE NOTICE 'Added tasks table to supabase_realtime publication';
  ELSE
    RAISE NOTICE 'Tasks table already in supabase_realtime publication';
  END IF;
END $$;

COMMIT;

-- Verify the configuration
SELECT 'Realtime configuration for tasks:' as info;
SELECT * FROM realtime.subscription WHERE entity = 'tasks';

SELECT 'Publication tables:' as info;
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'tasks'; 