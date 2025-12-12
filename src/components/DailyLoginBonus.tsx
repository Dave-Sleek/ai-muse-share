import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Gift, Coins, Calendar, Sparkles } from 'lucide-react';

interface DailyLoginBonusProps {
  userId: string;
}

export const DailyLoginBonus = ({ userId }: DailyLoginBonusProps) => {
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [consecutiveDays, setConsecutiveDays] = useState(1);
  const [todayReward, setTodayReward] = useState(5);

  useEffect(() => {
    if (userId) {
      checkLoginStatus();
    }
  }, [userId]);

  const checkLoginStatus = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_logins')
        .select('*')
        .eq('user_id', userId)
        .eq('login_date', today)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setClaimed(true);
        setTodayReward(data.coins_earned);
      } else {
        // Calculate potential reward
        const { data: recentLogins } = await supabase
          .from('daily_logins')
          .select('login_date')
          .eq('user_id', userId)
          .order('login_date', { ascending: false })
          .limit(7);

        if (recentLogins && recentLogins.length > 0) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          let consecutive = 0;
          for (let i = 0; i < recentLogins.length; i++) {
            const checkDate = new Date();
            checkDate.setDate(checkDate.getDate() - (i + 1));
            const checkDateStr = checkDate.toISOString().split('T')[0];
            
            if (recentLogins.some(l => l.login_date === checkDateStr)) {
              consecutive++;
            } else {
              break;
            }
          }
          setConsecutiveDays(consecutive + 1);
          setTodayReward(5 + Math.min(consecutive, 6) * 2);
        }
      }
    } catch (error) {
      console.error('Error checking login status:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimDailyBonus = async () => {
    setClaiming(true);
    try {
      const { data, error } = await supabase.rpc('claim_daily_login');

      if (error) throw error;

      const result = data as { success: boolean; coins: number; consecutive_days: number; message: string };

      if (result.success) {
        setClaimed(true);
        setTodayReward(result.coins);
        setConsecutiveDays(result.consecutive_days);
        toast({
          title: "🎁 Daily Bonus Claimed!",
          description: `You earned ${result.coins} coins! Day ${result.consecutive_days} streak.`,
        });
      } else {
        toast({
          title: "Already Claimed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error claiming bonus:', error);
      toast({
        title: "Error",
        description: "Failed to claim daily bonus",
        variant: "destructive",
      });
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`hover-lift overflow-hidden ${claimed ? 'opacity-75' : 'ring-2 ring-primary/50'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${claimed ? 'bg-muted' : 'bg-gradient-to-br from-primary/20 to-secondary/20'}`}>
            <Gift className={`w-5 h-5 ${claimed ? 'text-muted-foreground' : 'text-primary'}`} />
          </div>
          <div>
            <CardTitle>Daily Login Bonus</CardTitle>
            <CardDescription>
              {claimed ? 'Come back tomorrow!' : 'Claim your daily reward'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Reward Display */}
        <div className="flex items-center justify-center py-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Coins className={`w-8 h-8 ${claimed ? 'text-muted-foreground' : 'text-yellow-500'}`} />
              <span className="text-4xl font-bold">{todayReward}</span>
            </div>
            <p className="text-sm text-muted-foreground">coins today</p>
          </div>
        </div>

        {/* Streak Info */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm">Day {consecutiveDays} Streak</span>
          </div>
          {consecutiveDays > 1 && (
            <Badge variant="secondary" className="text-xs">
              +{Math.min(consecutiveDays - 1, 6) * 2} bonus
            </Badge>
          )}
        </div>

        {/* Claim Button */}
        {claimed ? (
          <div className="p-3 rounded-lg bg-green-500/10 text-center">
            <Sparkles className="w-4 h-4 inline mr-1 text-green-500" />
            <span className="text-sm text-green-500">Claimed for today!</span>
          </div>
        ) : (
          <Button 
            onClick={claimDailyBonus} 
            disabled={claiming}
            className="w-full"
          >
            {claiming ? 'Claiming...' : `Claim ${todayReward} Coins`}
          </Button>
        )}

        {/* Bonus Info */}
        <p className="text-xs text-muted-foreground text-center">
          Login daily to earn up to 17 coins (5 base + 12 streak bonus)
        </p>
      </CardContent>
    </Card>
  );
};
