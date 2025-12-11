import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Coins, TrendingUp, Gift, Eye, Loader2 } from "lucide-react";

interface EarningsCardProps {
  userId: string;
}

export const EarningsCard = ({ userId }: EarningsCardProps) => {
  const [coinBalance, setCoinBalance] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [giftEarnings, setGiftEarnings] = useState(0);
  const [viewEarnings, setViewEarnings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, [userId]);

  const fetchEarnings = async () => {
    setLoading(true);

    // Fetch profile balances
    const { data: profile } = await supabase
      .from("profiles")
      .select("coin_balance, total_earnings")
      .eq("id", userId)
      .single();

    if (profile) {
      setCoinBalance(profile.coin_balance);
      setTotalEarnings(profile.total_earnings);
    }

    // Fetch gift earnings
    const { data: gifts } = await supabase
      .from("gift_transactions")
      .select("coin_amount")
      .eq("recipient_id", userId);

    if (gifts) {
      setGiftEarnings(gifts.reduce((sum, g) => sum + g.coin_amount, 0));
    }

    // Fetch view earnings
    const { data: views } = await supabase
      .from("view_earnings")
      .select("coins_earned")
      .eq("user_id", userId);

    if (views) {
      setViewEarnings(views.reduce((sum, v) => sum + v.coins_earned, 0));
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="glass-effect rounded-2xl p-6 border border-border/40">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-effect rounded-2xl p-6 border border-border/40">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Coins className="w-5 h-5 text-yellow-500" />
        Earnings Overview
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Coins className="w-4 h-4 text-yellow-500" />
            Current Balance
          </div>
          <div className="text-3xl font-bold">{coinBalance}</div>
          <div className="text-xs text-muted-foreground">coins</div>
        </div>

        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            Total Earned
          </div>
          <div className="text-3xl font-bold">{totalEarnings}</div>
          <div className="text-xs text-muted-foreground">all time</div>
        </div>

        <div className="bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Gift className="w-4 h-4 text-pink-500" />
            From Gifts
          </div>
          <div className="text-2xl font-bold">{giftEarnings}</div>
          <div className="text-xs text-muted-foreground">coins received</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Eye className="w-4 h-4 text-blue-500" />
            From Views
          </div>
          <div className="text-2xl font-bold">{viewEarnings}</div>
          <div className="text-xs text-muted-foreground">1 coin / 10 views</div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        Earn coins when others view your posts (1 coin per 10 views) or receive gifts from fans!
      </p>
    </div>
  );
};
