import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Flame, Trophy, Calendar, Zap, Coins } from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface UserStreak {
  id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  streak_type: string;
  streak_coins_claimed: number[];
}

interface StreakTrackerProps {
  userId: string;
}

const MILESTONES = [
  { days: 7, reward: 25, label: '7 Day Streak' },
  { days: 30, reward: 100, label: '30 Day Streak' },
  { days: 100, reward: 500, label: '100 Day Streak' },
];

const StreakTracker: React.FC<StreakTrackerProps> = ({ userId }) => {
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<number | null>(null);

  useEffect(() => {
    fetchStreak();
  }, [userId]);

  const fetchStreak = async () => {
    try {
      const { data, error } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", userId)
        .eq("streak_type", "posts")
        .maybeSingle();

      if (error) throw error;
      setStreak(data as UserStreak | null);
    } catch (error) {
      console.error("Error fetching streak:", error);
    } finally {
      setLoading(false);
    }
  };

  const claimMilestone = async (milestone: number) => {
    setClaiming(milestone);
    try {
      const { data, error } = await supabase.rpc('claim_streak_milestone', { p_milestone: milestone });

      if (error) throw error;

      const result = data as { success: boolean; coins: number; milestone: number; message?: string };

      if (result.success) {
        setStreak(prev => prev ? {
          ...prev,
          streak_coins_claimed: [...(prev.streak_coins_claimed || []), milestone]
        } : null);
        toast({
          title: "🔥 Streak Milestone Claimed!",
          description: `You earned ${result.coins} coins for your ${milestone}-day streak!`,
        });
      } else {
        toast({
          title: "Cannot Claim",
          description: result.message || "Already claimed",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error claiming milestone:', error);
      toast({
        title: "Error",
        description: "Failed to claim milestone reward",
        variant: "destructive",
      });
    } finally {
      setClaiming(null);
    }
  };

  const getStreakStatus = () => {
    if (!streak?.last_activity_date) return { status: "none", message: "Start your streak today!" };
    
    const lastDate = new Date(streak.last_activity_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    lastDate.setHours(0, 0, 0, 0);
    
    const daysDiff = differenceInDays(today, lastDate);
    
    if (daysDiff === 0) {
      return { status: "active", message: "You posted today! Keep it up!" };
    } else if (daysDiff === 1) {
      return { status: "warning", message: "Post today to keep your streak!" };
    } else {
      return { status: "broken", message: "Your streak was reset. Start again!" };
    }
  };

  const getFlameColor = () => {
    if (!streak || streak.current_streak === 0) return "text-muted-foreground";
    if (streak.current_streak >= 30) return "text-orange-500";
    if (streak.current_streak >= 7) return "text-yellow-500";
    return "text-primary";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const { status, message } = getStreakStatus();
  const currentStreak = streak?.current_streak ?? 0;
  const longestStreak = streak?.longest_streak ?? 0;

  return (
    <Card className="hover-lift overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${currentStreak > 0 ? 'bg-gradient-to-br from-orange-500/20 to-yellow-500/20' : 'bg-muted'}`}>
            <Flame className={`w-5 h-5 ${getFlameColor()}`} />
          </div>
          <div>
            <CardTitle>Posting Streak</CardTitle>
            <CardDescription>Consecutive days of posting</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Streak Display */}
        <div className="flex items-center justify-center py-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Flame className={`w-8 h-8 ${getFlameColor()} ${currentStreak >= 7 ? 'animate-pulse' : ''}`} />
              <span className="text-5xl font-bold">{currentStreak}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {currentStreak === 1 ? "day" : "days"}
            </p>
          </div>
        </div>

        {/* Status Message */}
        <div className={`p-3 rounded-lg text-center text-sm ${
          status === "active" ? "bg-green-500/10 text-green-500" :
          status === "warning" ? "bg-yellow-500/10 text-yellow-600" :
          status === "broken" ? "bg-muted text-muted-foreground" :
          "bg-muted text-muted-foreground"
        }`}>
          <Zap className="w-4 h-4 inline mr-1" />
          {message}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="font-semibold">{longestStreak}</span>
            </div>
            <p className="text-xs text-muted-foreground">Best Streak</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="font-semibold">
                {streak?.last_activity_date 
                  ? format(new Date(streak.last_activity_date), "MMM d")
                  : "—"
                }
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Last Post</p>
          </div>
        </div>

        {/* Streak Milestones with Rewards */}
        <div className="pt-2 border-t space-y-2">
          <p className="text-xs text-muted-foreground mb-2">Milestone Rewards</p>
          {MILESTONES.map(({ days, reward, label }) => {
            const reached = currentStreak >= days;
            const claimed = streak?.streak_coins_claimed?.includes(days);
            const canClaim = reached && !claimed;
            const progress = Math.min((currentStreak / days) * 100, 100);

            return (
              <div key={days} className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{label}</span>
                    <div className="flex items-center gap-1">
                      <Coins className="w-3 h-3 text-yellow-500" />
                      <span className="text-xs font-medium">{reward}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        claimed ? 'bg-green-500' : 
                        reached ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                        'bg-gradient-to-r from-primary/50 to-secondary/50'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                {canClaim ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-yellow-500/50 text-yellow-600 hover:bg-yellow-500/10"
                    onClick={() => claimMilestone(days)}
                    disabled={claiming === days}
                  >
                    {claiming === days ? '...' : 'Claim'}
                  </Button>
                ) : claimed ? (
                  <Badge variant="outline" className="text-xs border-green-500/50 text-green-600">
                    ✓
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {currentStreak}/{days}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default StreakTracker;