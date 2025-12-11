-- Add coin balance to profiles
ALTER TABLE public.profiles ADD COLUMN coin_balance integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN total_earnings integer NOT NULL DEFAULT 0;

-- Create virtual gifts table
CREATE TABLE public.virtual_gifts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  icon text NOT NULL,
  coin_cost integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create gift transactions table
CREATE TABLE public.gift_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL,
  gift_id uuid NOT NULL REFERENCES public.virtual_gifts(id) ON DELETE CASCADE,
  coin_amount integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create view earnings table (tracks daily view earnings)
CREATE TABLE public.view_earnings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL,
  view_count integer NOT NULL DEFAULT 0,
  coins_earned integer NOT NULL DEFAULT 0,
  earning_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id, earning_date)
);

-- Enable RLS
ALTER TABLE public.virtual_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.view_earnings ENABLE ROW LEVEL SECURITY;

-- Virtual gifts policies (public read)
CREATE POLICY "Virtual gifts are viewable by everyone"
ON public.virtual_gifts FOR SELECT
USING (true);

-- Gift transactions policies
CREATE POLICY "Users can view their sent and received gifts"
ON public.gift_transactions FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send gifts"
ON public.gift_transactions FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- View earnings policies
CREATE POLICY "Users can view their own earnings"
ON public.view_earnings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert view earnings"
ON public.view_earnings FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update view earnings"
ON public.view_earnings FOR UPDATE
USING (true);

-- Insert default virtual gifts
INSERT INTO public.virtual_gifts (name, icon, coin_cost) VALUES
('Heart', '❤️', 10),
('Star', '⭐', 25),
('Fire', '🔥', 50),
('Diamond', '💎', 100),
('Crown', '👑', 250),
('Rocket', '🚀', 500);

-- Function to send a gift
CREATE OR REPLACE FUNCTION public.send_gift(
  p_recipient_id uuid,
  p_post_id uuid,
  p_gift_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gift_cost integer;
  v_sender_balance integer;
BEGIN
  -- Get gift cost
  SELECT coin_cost INTO v_gift_cost FROM public.virtual_gifts WHERE id = p_gift_id;
  IF v_gift_cost IS NULL THEN
    RAISE EXCEPTION 'Gift not found';
  END IF;

  -- Get sender balance
  SELECT coin_balance INTO v_sender_balance FROM public.profiles WHERE id = auth.uid();
  IF v_sender_balance < v_gift_cost THEN
    RAISE EXCEPTION 'Insufficient coins';
  END IF;

  -- Deduct from sender
  UPDATE public.profiles SET coin_balance = coin_balance - v_gift_cost WHERE id = auth.uid();

  -- Add to recipient
  UPDATE public.profiles 
  SET coin_balance = coin_balance + v_gift_cost,
      total_earnings = total_earnings + v_gift_cost
  WHERE id = p_recipient_id;

  -- Record transaction
  INSERT INTO public.gift_transactions (sender_id, recipient_id, post_id, gift_id, coin_amount)
  VALUES (auth.uid(), p_recipient_id, p_post_id, p_gift_id, v_gift_cost);

  RETURN true;
END;
$$;

-- Function to credit view earnings (1 coin per 10 views)
CREATE OR REPLACE FUNCTION public.credit_view_earnings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post_owner uuid;
  v_current_views integer;
  v_earned_coins integer;
BEGIN
  -- Get post owner
  SELECT user_id INTO v_post_owner FROM public.posts WHERE id = NEW.post_id;
  IF v_post_owner IS NULL THEN
    RETURN NEW;
  END IF;

  -- Insert or update view earnings for today
  INSERT INTO public.view_earnings (user_id, post_id, view_count, coins_earned, earning_date)
  VALUES (v_post_owner, NEW.post_id, 1, 0, CURRENT_DATE)
  ON CONFLICT (user_id, post_id, earning_date)
  DO UPDATE SET view_count = view_earnings.view_count + 1;

  -- Get current view count for today
  SELECT view_count INTO v_current_views
  FROM public.view_earnings
  WHERE user_id = v_post_owner AND post_id = NEW.post_id AND earning_date = CURRENT_DATE;

  -- Credit 1 coin for every 10 views
  IF v_current_views % 10 = 0 THEN
    UPDATE public.view_earnings
    SET coins_earned = coins_earned + 1
    WHERE user_id = v_post_owner AND post_id = NEW.post_id AND earning_date = CURRENT_DATE;

    UPDATE public.profiles
    SET coin_balance = coin_balance + 1,
        total_earnings = total_earnings + 1
    WHERE id = v_post_owner;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger for view earnings
CREATE TRIGGER on_post_view_earnings
  AFTER INSERT ON public.post_views
  FOR EACH ROW EXECUTE FUNCTION public.credit_view_earnings();