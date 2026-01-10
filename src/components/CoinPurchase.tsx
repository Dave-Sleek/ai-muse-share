import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Sparkles, Zap, Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  price: string;
  bonus?: string;
  icon: React.ReactNode;
  popular?: boolean;
}

const PACKAGES: CoinPackage[] = [
  {
    id: "pack_50",
    name: "Starter Pack",
    coins: 50,
    price: "$1.99",
    icon: <Coins className="w-6 h-6" />,
  },
  {
    id: "pack_150",
    name: "Value Pack",
    coins: 150,
    price: "$4.99",
    bonus: "Best Value",
    icon: <Zap className="w-6 h-6" />,
    popular: true,
  },
  {
    id: "pack_400",
    name: "Premium Pack",
    coins: 400,
    price: "$9.99",
    bonus: "Most Popular",
    icon: <Crown className="w-6 h-6" />,
  },
];

export const CoinPurchase = () => {
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (packageId: string) => {
    try {
      setLoading(packageId);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to purchase coins");
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { packageId },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      console.error("Purchase error:", error);
      toast.error(error.message || "Failed to start checkout");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 mb-3">
          <Sparkles className="w-6 h-6 text-yellow-500" />
        </div>
        <h2 className="text-2xl font-bold">Purchase Coins</h2>
        <p className="text-muted-foreground mt-1">
          Buy coins to send virtual gifts to your favorite creators
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {PACKAGES.map((pkg) => (
          <Card
            key={pkg.id}
            className={`relative overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer ${
              pkg.popular
                ? "border-primary ring-2 ring-primary/20"
                : "border-border/40"
            }`}
            onClick={() => !loading && handlePurchase(pkg.id)}
          >
            {pkg.bonus && (
              <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs font-semibold px-3 py-1 rounded-bl-lg">
                {pkg.bonus}
              </div>
            )}
            <CardHeader className="text-center pb-2">
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-full mx-auto mb-2 ${
                  pkg.popular
                    ? "bg-gradient-to-br from-primary/20 to-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {pkg.icon}
              </div>
              <CardTitle className="text-lg">{pkg.name}</CardTitle>
              <CardDescription className="flex items-center justify-center gap-1">
                <Coins className="w-4 h-4 text-yellow-500" />
                <span className="font-semibold text-foreground">{pkg.coins}</span> coins
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold mb-3">{pkg.price}</div>
              <Button
                className="w-full"
                variant={pkg.popular ? "default" : "outline"}
                disabled={loading === pkg.id}
              >
                {loading === pkg.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Buy Now"
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Secure payments powered by Stripe. Coins are non-refundable.
      </p>
    </div>
  );
};
