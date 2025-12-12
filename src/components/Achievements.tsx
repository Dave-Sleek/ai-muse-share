import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import {
  Sparkles, Flame, Zap, Trophy, Heart, Star, Rocket,
  MessageCircle, Users, Calendar, Crown, UserPlus, TrendingUp, Award, Lock, Coins
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
  requirement_type: string;
  requirement_value: number;
  coin_reward: number;
}

interface UserAchievement {
  achievement_id: string;
  unlocked_at: string;
}

interface UserStats {
  posts: number;
  likes_received: number;
  comments_received: number;
  followers: number;
  streak: number;
}

interface AchievementsProps {
  userId: string;
  userStats: UserStats;
}

export const Achievements = ({ userId, userStats }: AchievementsProps) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchAchievements();
    }
  }, [userId]);

  useEffect(() => {
    if (achievements.length > 0 && userId) {
      checkAndUnlockAchievements();
    }
  }, [achievements, userStats, userId]);

  const fetchAchievements = async () => {
    try {
      const [achievementsRes, unlockedRes] = await Promise.all([
        supabase.from('achievements').select('*').order('requirement_value'),
        supabase.from('user_achievements').select('*').eq('user_id', userId)
      ]);

      if (achievementsRes.error) throw achievementsRes.error;
      if (unlockedRes.error) throw unlockedRes.error;

      setAchievements(achievementsRes.data || []);
      setUnlockedAchievements(unlockedRes.data || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAndUnlockAchievements = async () => {
    const unlockedIds = new Set(unlockedAchievements.map(ua => ua.achievement_id));
    const newlyUnlocked: Achievement[] = [];

    for (const achievement of achievements) {
      if (unlockedIds.has(achievement.id)) continue;

      const currentValue = getStatValue(achievement.requirement_type);
      if (currentValue >= achievement.requirement_value) {
        try {
          const { error } = await supabase
            .from('user_achievements')
            .insert({ user_id: userId, achievement_id: achievement.id });

          if (!error) {
            newlyUnlocked.push(achievement);
          }
        } catch (err) {
          console.error('Error unlocking achievement:', err);
        }
      }
    }

    if (newlyUnlocked.length > 0) {
      setUnlockedAchievements(prev => [
        ...prev,
        ...newlyUnlocked.map(a => ({ achievement_id: a.id, unlocked_at: new Date().toISOString() }))
      ]);

      newlyUnlocked.forEach(achievement => {
        toast({
          title: "🏆 Achievement Unlocked!",
          description: `${achievement.name}: ${achievement.description} (+${achievement.coin_reward} coins)`,
        });
      });
    }
  };

  const getStatValue = (type: string): number => {
    switch (type) {
      case 'posts': return userStats.posts;
      case 'likes_received': return userStats.likes_received;
      case 'comments_received': return userStats.comments_received;
      case 'followers': return userStats.followers;
      case 'streak': return userStats.streak;
      default: return 0;
    }
  };

  const isUnlocked = (achievementId: string) => {
    return unlockedAchievements.some(ua => ua.achievement_id === achievementId);
  };

  const getProgress = (achievement: Achievement): number => {
    const current = getStatValue(achievement.requirement_type);
    return Math.min((current / achievement.requirement_value) * 100, 100);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const unlockedCount = unlockedAchievements.length;
  const totalCount = achievements.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Achievements
          </CardTitle>
          <Badge variant="secondary" className="text-sm">
            {unlockedCount}/{totalCount} Unlocked
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {achievements.map((achievement) => {
            const unlocked = isUnlocked(achievement.id);
            const progress = getProgress(achievement);
            const IconComponent = ICON_MAP[achievement.icon] || Trophy;

            return (
              <div
                key={achievement.id}
                className={`relative p-4 rounded-lg border transition-all ${
                  unlocked
                    ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30'
                    : 'bg-muted/30 border-border opacity-60'
                }`}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div
                    className={`p-3 rounded-full ${
                      unlocked
                        ? 'bg-gradient-to-br from-yellow-500 to-orange-500 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {unlocked ? (
                      <IconComponent className="h-6 w-6" />
                    ) : (
                      <Lock className="h-6 w-6" />
                    )}
                  </div>
                  <h4 className="font-semibold text-sm">{achievement.name}</h4>
                  <div className="flex items-center gap-1 text-xs text-yellow-600">
                    <Coins className="w-3 h-3" />
                    <span>{achievement.coin_reward} coins</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {achievement.description}
                  </p>
                  {!unlocked && (
                    <div className="w-full mt-2">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.round(progress)}%
                      </p>
                    </div>
                  )}
                  {unlocked && (
                    <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-600">
                      ✓ Unlocked
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
