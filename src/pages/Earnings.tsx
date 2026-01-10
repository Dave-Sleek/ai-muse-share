import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { EarningsCard } from "@/components/EarningsCard";
import { GiftHistory } from "@/components/GiftHistory";
import { CoinPurchase } from "@/components/CoinPurchase";
import { Loader2, Coins, TrendingUp, Info } from "lucide-react";
import { toast } from "sonner";

const Earnings = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const purchase = searchParams.get("purchase");
    if (purchase === "success") {
      toast.success("Coins purchased successfully! Your balance has been updated.");
      setSearchParams({});
    } else if (purchase === "cancelled") {
      toast.info("Purchase cancelled");
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/auth");
        return;
      }
      setCurrentUser(session.user);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        navigate("/auth");
        return;
      }
      setCurrentUser(session.user);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 mb-4">
              <Coins className="w-8 h-8 text-yellow-500" />
            </div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Your Earnings</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Track your coin balance, view earnings from posts, and see your gift history
            </p>
          </div>

          {/* How it works */}
          <div className="glass-effect rounded-2xl p-6 border border-border/40 mb-8">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              How Earnings Work
            </h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <div className="font-medium">Views Earnings</div>
                  <div className="text-muted-foreground">
                    Earn 1 coin for every 10 views on your posts. Views are tracked automatically!
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">🎁</span>
                </div>
                <div>
                  <div className="font-medium">Gift Earnings</div>
                  <div className="text-muted-foreground">
                    Receive virtual gifts from fans who love your content. 100% of gift value goes to you!
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Earnings Overview */}
          <div className="mb-8">
            <EarningsCard userId={currentUser.id} />
          </div>

          {/* Purchase Coins */}
          <div className="glass-effect rounded-2xl p-6 border border-border/40 mb-8">
            <CoinPurchase />
          </div>

          {/* Gift History */}
          <GiftHistory userId={currentUser.id} />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Earnings;
