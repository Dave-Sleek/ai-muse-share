-- Create achievements table for storing achievement definitions
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_achievements table for tracking unlocked achievements
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Achievements are viewable by everyone
CREATE POLICY "Achievements are viewable by everyone"
ON public.achievements FOR SELECT USING (true);

-- Users can view their own unlocked achievements
CREATE POLICY "Users can view their own achievements"
ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);

-- Users can unlock achievements for themselves
CREATE POLICY "Users can unlock their own achievements"
ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, requirement_type, requirement_value) VALUES
('First Steps', 'Create your first post', 'Sparkles', 'posts', 1),
('Getting Started', 'Create 10 posts', 'Flame', 'posts', 10),
('Prolific Creator', 'Create 50 posts', 'Zap', 'posts', 50),
('Century Club', 'Create 100 posts', 'Trophy', 'posts', 100),
('First Fan', 'Receive your first like', 'Heart', 'likes_received', 1),
('Popular Post', 'Receive 50 likes on your posts', 'Star', 'likes_received', 50),
('Viral Sensation', 'Receive 500 likes on your posts', 'Rocket', 'likes_received', 500),
('Conversation Starter', 'Receive your first comment', 'MessageCircle', 'comments_received', 1),
('Engaged Community', 'Receive 50 comments', 'Users', 'comments_received', 50),
('Week Warrior', 'Maintain a 7-day posting streak', 'Calendar', 'streak', 7),
('Month Master', 'Maintain a 30-day posting streak', 'Crown', 'streak', 30),
('First Follower', 'Get your first follower', 'UserPlus', 'followers', 1),
('Rising Star', 'Reach 50 followers', 'TrendingUp', 'followers', 50),
('Influencer', 'Reach 100 followers', 'Award', 'followers', 100);