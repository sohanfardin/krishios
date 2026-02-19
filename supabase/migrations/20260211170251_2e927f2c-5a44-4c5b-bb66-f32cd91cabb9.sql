
-- Add new fields to crops table
ALTER TABLE public.crops
  ADD COLUMN IF NOT EXISTS soil_type text,
  ADD COLUMN IF NOT EXISTS last_irrigation_date date,
  ADD COLUMN IF NOT EXISTS last_fertilizer_date date;

-- Add new fields to livestock table  
ALTER TABLE public.livestock
  ADD COLUMN IF NOT EXISTS medicine_cost numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_illness_date date,
  ADD COLUMN IF NOT EXISTS daily_production_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_production_unit text;

-- Create farm_tasks table for scheduling
CREATE TABLE public.farm_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  title text NOT NULL,
  title_bn text,
  description text,
  task_type text NOT NULL DEFAULT 'manual',
  related_crop_id uuid REFERENCES public.crops(id) ON DELETE SET NULL,
  related_livestock_id uuid REFERENCES public.livestock(id) ON DELETE SET NULL,
  due_date date NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  priority text NOT NULL DEFAULT 'medium',
  source text DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.farm_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tasks"
  ON public.farm_tasks FOR ALL
  USING (owns_farm(farm_id))
  WITH CHECK (owns_farm(farm_id));

CREATE TRIGGER update_farm_tasks_updated_at
  BEFORE UPDATE ON public.farm_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
