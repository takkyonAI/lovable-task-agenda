-- Check if realtime is enabled for tasks table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'tasks';

-- Check realtime configuration
SELECT * FROM realtime.subscription WHERE entity = 'tasks';

-- Check if realtime is enabled on the table
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM realtime.subscription 
      WHERE entity = tablename 
      AND schemaname = pg_tables.schemaname
    ) THEN 'enabled' 
    ELSE 'disabled' 
  END as realtime_status
FROM pg_tables 
WHERE tablename = 'tasks';

-- Check RLS policies that might affect realtime
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd, 
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'tasks'
ORDER BY policyname; 