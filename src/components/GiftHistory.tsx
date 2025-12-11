import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Gift, ArrowUpRight, ArrowDownLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

interface GiftTransaction {
  id: string;
  sender_id: string;
  recipient_id: string;
  post_id: string | null;
  coin_amount: number;
  created_at: string;
  sender_username?: string;
  recipient_username?: string;
  gift_icon?: string;
  gift_name?: string;
}

interface GiftHistoryProps {
  userId: string;
}

export const GiftHistory = ({ userId }: GiftHistoryProps) => {
  const [transactions, setTransactions] = useState<GiftTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, [userId]);

  const fetchTransactions = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("gift_transactions")
      .select(`
        *,
        virtual_gifts (name, icon)
      `)
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      // Fetch usernames for each transaction
      const enrichedTransactions = await Promise.all(
        data.map(async (tx) => {
          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", tx.sender_id)
            .single();

          const { data: recipientProfile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", tx.recipient_id)
            .single();

          return {
            ...tx,
            sender_username: senderProfile?.username || "Unknown",
            recipient_username: recipientProfile?.username || "Unknown",
            gift_icon: (tx.virtual_gifts as any)?.icon,
            gift_name: (tx.virtual_gifts as any)?.name,
          };
        })
      );

      setTransactions(enrichedTransactions);
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
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Gift className="w-5 h-5 text-pink-500" />
        Gift History
      </h3>

      {transactions.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No gift transactions yet
        </p>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {transactions.map((tx) => {
            const isReceived = tx.recipient_id === userId;

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isReceived ? "bg-green-500/20" : "bg-red-500/20"
                    }`}
                  >
                    {isReceived ? (
                      <ArrowDownLeft className="w-5 h-5 text-green-500" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{tx.gift_icon}</span>
                      <span className="font-medium">{tx.gift_name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {isReceived ? (
                        <>
                          From{" "}
                          <Link
                            to={`/profile/${tx.sender_id}`}
                            className="hover:text-primary"
                          >
                            {tx.sender_username}
                          </Link>
                        </>
                      ) : (
                        <>
                          To{" "}
                          <Link
                            to={`/profile/${tx.recipient_id}`}
                            className="hover:text-primary"
                          >
                            {tx.recipient_username}
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`font-semibold ${
                      isReceived ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {isReceived ? "+" : "-"}{tx.coin_amount}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(tx.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
