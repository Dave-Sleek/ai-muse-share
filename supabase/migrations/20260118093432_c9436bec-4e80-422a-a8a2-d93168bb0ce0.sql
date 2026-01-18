-- Add premium fields to prompt_templates
ALTER TABLE public.prompt_templates 
ADD COLUMN is_premium boolean NOT NULL DEFAULT false,
ADD COLUMN unlock_cost integer NOT NULL DEFAULT 0;

-- Create table to track template unlocks
CREATE TABLE public.template_unlocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_id UUID NOT NULL REFERENCES public.prompt_templates(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  coins_spent INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, template_id)
);

-- Enable RLS
ALTER TABLE public.template_unlocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for template_unlocks
CREATE POLICY "Users can view their own unlocks"
ON public.template_unlocks
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own unlocks"
ON public.template_unlocks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to unlock a premium template
CREATE OR REPLACE FUNCTION public.unlock_template(p_template_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_template RECORD;
  v_current_balance INTEGER;
  v_already_unlocked BOOLEAN;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get template details
  SELECT id, is_premium, unlock_cost INTO v_template
  FROM prompt_templates
  WHERE id = p_template_id;

  IF v_template.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Template not found');
  END IF;

  IF NOT v_template.is_premium THEN
    RETURN json_build_object('success', false, 'error', 'Template is not premium');
  END IF;

  -- Check if already unlocked
  SELECT EXISTS(
    SELECT 1 FROM template_unlocks
    WHERE user_id = v_user_id AND template_id = p_template_id
  ) INTO v_already_unlocked;

  IF v_already_unlocked THEN
    RETURN json_build_object('success', false, 'error', 'Template already unlocked');
  END IF;

  -- Get user's coin balance
  SELECT coin_balance INTO v_current_balance
  FROM profiles
  WHERE id = v_user_id;

  IF v_current_balance < v_template.unlock_cost THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient coins', 'required', v_template.unlock_cost, 'balance', v_current_balance);
  END IF;

  -- Deduct coins
  UPDATE profiles
  SET coin_balance = coin_balance - v_template.unlock_cost,
      updated_at = now()
  WHERE id = v_user_id;

  -- Record the unlock
  INSERT INTO template_unlocks (user_id, template_id, coins_spent)
  VALUES (v_user_id, p_template_id, v_template.unlock_cost);

  -- Give creator a portion of the coins (50%)
  UPDATE profiles
  SET coin_balance = coin_balance + (v_template.unlock_cost / 2),
      total_earnings = total_earnings + (v_template.unlock_cost / 2),
      updated_at = now()
  WHERE id = (SELECT user_id FROM prompt_templates WHERE id = p_template_id);

  RETURN json_build_object('success', true, 'coins_spent', v_template.unlock_cost);
END;
$$;