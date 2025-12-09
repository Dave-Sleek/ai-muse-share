import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, Trophy, Calendar, Zap } from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface UserStreak {
  id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  streak_type: string;
}

interface StreakTrackerProps {
  userId: string;
}

const StreakTracker: React.FC<StreakTrackerProps> = ({ userId }) => {
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [loading, setLoading] = useState(true);

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

        {/* Streak Milestones */}
        {currentStreak > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">Next milestone</p>
            <div className="flex items-center gap-2">
              {currentStreak < 7 && (
                <>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                      style={{ width: `${(currentStreak / 7) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">7 days</span>
                </>
              )}
              {currentStreak >= 7 && currentStreak < 30 && (
                <>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all"
                      style={{ width: `${(currentStreak / 30) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">30 days</span>
                </>
              )}
              {currentStreak >= 30 && currentStreak < 100 && (
                <>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all"
                      style={{ width: `${(currentStreak / 100) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">100 days</span>
                </>
              )}
              {currentStreak >= 100 && (
                <span className="text-xs font-medium text-orange-500">🔥 Legendary!</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StreakTracker;