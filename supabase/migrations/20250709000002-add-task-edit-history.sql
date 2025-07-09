-- Migration: Add task edit history fields
-- This adds fields to track who edited a task and when
-- Date: 2025-01-09

-- Add columns for edit tracking
ALTER TABLE public.tasks 
ADD COLUMN edited_by UUID REFERENCES public.user_profiles(user_id),
ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE;

-- Add comments to document the columns
COMMENT ON COLUMN public.tasks.edited_by IS 'User who last edited this task';
COMMENT ON COLUMN public.tasks.edited_at IS 'Timestamp when task was last edited';

-- Create function to update edit tracking on task updates
CREATE OR REPLACE FUNCTION public.update_task_edit_tracking()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update edit tracking if it's not a status change to completed
    -- (status changes are handled differently)
    IF OLD.title != NEW.title OR 
       OLD.description != NEW.description OR 
       OLD.priority != NEW.priority OR
       OLD.due_date != NEW.due_date OR
       OLD.assigned_users != NEW.assigned_users OR
       OLD.is_private != NEW.is_private THEN
        
        NEW.edited_by = auth.uid();
        NEW.edited_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update edit tracking
CREATE TRIGGER update_task_edit_tracking_trigger
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_task_edit_tracking();

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_tasks_edited_by ON public.tasks(edited_by);
CREATE INDEX IF NOT EXISTS idx_tasks_edited_at ON public.tasks(edited_at);

-- Grant necessary permissions
GRANT SELECT, UPDATE ON public.tasks TO authenticated;

-- Add comment to the function
COMMENT ON FUNCTION public.update_task_edit_tracking() IS 'Automatically tracks who edited a task and when, excluding status-only changes'; 