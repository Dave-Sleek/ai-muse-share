import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Coins } from "lucide-react";

interface CoinBalanceProps {
  className?: string;
}

export const CoinBalance = ({ className }: CoinBalanceProps) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBalance();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchBalance();
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchBalance = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setBalance(null);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("coin_balance")
      .eq("id", user.id)
      .single();

    if (data) {
      setBalance(data.coin_balance);
    }
    setLoading(false);
  };

  if (loading || balance === null) return null;

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 rounded-full ${className}`}>
      <Coins className="w-4 h-4 text-yellow-500" />
      <span className="text-sm font-medium">{balance}</span>
    </div>
  );
};
