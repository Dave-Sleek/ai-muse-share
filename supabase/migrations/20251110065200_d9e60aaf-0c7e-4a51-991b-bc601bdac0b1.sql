-- Create challenges table
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  theme TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create challenge_submissions table
CREATE TABLE public.challenge_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, post_id)
);

-- Enable RLS
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for challenges
CREATE POLICY "Challenges are viewable by everyone"
  ON public.challenges
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can create challenges"
  ON public.challenges
  FOR INSERT
  WITH CHECK (false); -- Will be managed by admins only

CREATE POLICY "Only admins can update challenges"
  ON public.challenges
  FOR UPDATE
  USING (false);

CREATE POLICY "Only admins can delete challenges"
  ON public.challenges
  FOR DELETE
  USING (false);

-- RLS Policies for challenge_submissions
CREATE POLICY "Challenge submissions are viewable by everyone"
  ON public.challenge_submissions
  FOR SELECT
  USING (true);

CREATE POLICY "Users can submit their own posts to challenges"
  ON public.challenge_submissions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own challenge submissions"
  ON public.challenge_submissions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_challenges_dates ON public.challenges(start_date, end_date);
CREATE INDEX idx_challenge_submissions_challenge ON public.challenge_submissions(challenge_id);
CREATE INDEX idx_challenge_submissions_post ON public.challenge_submissions(post_id);