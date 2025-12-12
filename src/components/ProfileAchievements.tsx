import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sparkles, Flame, Zap, Trophy, Heart, Star, Rocket,
  MessageCircle, Users, Calendar, Crown, UserPlus, TrendingUp, Award, Coins
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles, Flame, Zap, Trophy, Heart, Star, Rocket,
  MessageCircle, Users, Calendar, Crown, UserPlus, TrendingUp, Award
};

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  coin_reward: number;
}

interface ProfileAchievementsProps {
  userId: string;
}

export const ProfileAchievements = ({ userId }: ProfileAchievementsProps) => {
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchUnlockedAchievements();
    }
  }, [userId]);

  const fetchUnlockedAchievements = async () => {
    try {
      // First get user's unlocked achievement IDs
      const { data: userAchievements, error: userError } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', userId);

      if (userError) throw userError;

      if (!userAchievements || userAchievements.length === 0) {
        setUnlockedAchievements([]);
        setLoading(false);
        return;
      }

      // Then fetch the achievement details
      const achievementIds = userAchievements.map(ua => ua.achievement_id);
      const { data: achievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('id, name, description, icon, coin_reward')
        .in('id', achievementIds);

      if (achievementsError) throw achievementsError;

      setUnlockedAchievements(achievements || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-effect rounded-2xl p-6 border border-border/40">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <h3 className="font-semibold">Achievements</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  if (unlockedAchievements.length === 0) {
    return null;
  }

  return (
    <div className="glass-effect rounded-2xl p-6 border border-border/40 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <h3 className="font-semibold">Achievements</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {unlockedAchievements.length} Earned
        </Badge>
      </div>
      <div className="flex flex-wrap gap-3">
        {unlockedAchievements.map((achievement) => {
          const IconComponent = ICON_MAP[achievement.icon] || Trophy;
          
          return (
            <div
              key={achievement.id}
              className="group relative flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 hover:from-yellow-500/20 hover:to-orange-500/20 transition-all cursor-default"
              title={achievement.description}
            >
              <div className="p-1 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500">
                <IconComponent className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-medium">{achievement.name}</span>
              <div className="flex items-center gap-0.5 text-xs text-yellow-600">
                <Coins className="w-3 h-3" />
                <span>{achievement.coin_reward}</span>
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 w-48 text-center pointer-events-none">
                <p className="text-xs text-muted-foreground">{achievement.description}</p>
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-popover" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
