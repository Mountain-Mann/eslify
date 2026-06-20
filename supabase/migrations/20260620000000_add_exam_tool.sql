ALTER TABLE public.generations
  DROP CONSTRAINT IF EXISTS generations_tool_check;

ALTER TABLE public.generations
  ADD CONSTRAINT generations_tool_check
  CHECK (tool IN ('lesson', 'worksheet', 'check', 'corrector', 'vocabulary', 'exam'));
