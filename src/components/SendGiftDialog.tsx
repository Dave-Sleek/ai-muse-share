import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Gift, Coins, Loader2 } from "lucide-react";

interface VirtualGift {
  id: string;
  name: string;
  icon: string;
  coin_cost: number;
}

interface SendGiftDialogProps {
  recipientId: string;
  postId?: string;
  recipientUsername: string;
}

export const SendGiftDialog = ({ recipientId, postId, recipientUsername }: SendGiftDialogProps) => {
  const [open, setOpen] = useState(false);
  const [gifts, setGifts] = useState<VirtualGift[]>([]);
  const [userBalance, setUserBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedGift, setSelectedGift] = useState<VirtualGift | null>(null);

  useEffect(() => {
    if (open) {
      fetchGifts();
      fetchBalance();
    }
  }, [open]);

  const fetchGifts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("virtual_gifts")
      .select("*")
      .order("coin_cost", { ascending: true });

    if (!error && data) {
      setGifts(data);
    }
    setLoading(false);
  };

  const fetchBalance = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("coin_balance")
      .eq("id", user.id)
      .single();

    if (data) {
      setUserBalance(data.coin_balance);
    }
  };

  const handleSendGift = async () => {
    if (!selectedGift) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to send gifts",
        variant: "destructive",
      });
      return;
    }

    if (user.id === recipientId) {
      toast({
        title: "Cannot send gift",
        description: "You cannot send gifts to yourself",
        variant: "destructive",
      });
      return;
    }

    if (userBalance < selectedGift.coin_cost) {
      toast({
        title: "Insufficient coins",
        description: "You don't have enough coins to send this gift",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    const { error } = await supabase.rpc("send_gift", {
      p_recipient_id: recipientId,
      p_post_id: postId ?? null,
      p_gift_id: selectedGift.id,
    } as { p_recipient_id: string; p_post_id: string; p_gift_id: string });

    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to send gift",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Gift sent! 🎁",
        description: `You sent a ${selectedGift.name} to ${recipientUsername}`,
      });
      setOpen(false);
      setSelectedGift(null);
      fetchBalance();
    }
    setSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Gift className="w-4 h-4" />
          Send Gift
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Send a Gift to {recipientUsername}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between p-3 bg-muted rounded-lg mb-4">
          <span className="text-sm text-muted-foreground">Your Balance</span>
          <div className="flex items-center gap-1 font-semibold">
            <Coins className="w-4 h-4 text-yellow-500" />
            {userBalance} coins
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {gifts.map((gift) => (
              <button
                key={gift.id}
                onClick={() => setSelectedGift(gift)}
                className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                  selectedGift?.id === gift.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                } ${userBalance < gift.coin_cost ? "opacity-50" : ""}`}
                disabled={userBalance < gift.coin_cost}
              >
                <div className="text-3xl mb-2">{gift.icon}</div>
                <div className="text-xs font-medium">{gift.name}</div>
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
                  <Coins className="w-3 h-3 text-yellow-500" />
                  {gift.coin_cost}
                </div>
              </button>
            ))}
          </div>
        )}

        <Button
          onClick={handleSendGift}
          disabled={!selectedGift || sending}
          className="w-full mt-4"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Gift className="w-4 h-4 mr-2" />
          )}
          {selectedGift
            ? `Send ${selectedGift.name} (${selectedGift.coin_cost} coins)`
            : "Select a gift"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
