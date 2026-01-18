import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Crown, Coins } from "lucide-react";

interface SaveAsTemplateDialogProps {
  postId: string;
  postTitle: string;
  userId: string;
  onTemplateSaved?: () => void;
}

const TEMPLATE_CATEGORIES = [
  "Character Design",
  "Landscape",
  "Portrait",
  "Abstract",
  "Architecture",
  "Fantasy",
  "Sci-Fi",
  "Animal",
  "Other"
];

const PREMIUM_CATEGORIES = [
  "Masterpiece",
  "Photorealistic",
  "Cinematic",
  "Concept Art",
  "Digital Painting"
];

const ALL_CATEGORIES = [...TEMPLATE_CATEGORIES, ...PREMIUM_CATEGORIES];

const UNLOCK_COSTS = [
  { value: 10, label: "10 coins" },
  { value: 25, label: "25 coins" },
  { value: 50, label: "50 coins" },
  { value: 100, label: "100 coins" },
];

const SaveAsTemplateDialog: React.FC<SaveAsTemplateDialogProps> = ({
  postId,
  postTitle,
  userId,
  onTemplateSaved,
}) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(postTitle);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [unlockCost, setUnlockCost] = useState(25);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please provide a template name",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("prompt_templates")
        .insert({
          post_id: postId,
          user_id: userId,
          name: name.trim(),
          description: description.trim() || null,
          category: category || null,
          is_public: isPublic,
          is_premium: isPremium,
          unlock_cost: isPremium ? unlockCost : 0,
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: isPremium 
          ? `Your premium template is live! You'll earn ${Math.floor(unlockCost / 2)} coins each time someone unlocks it.`
          : "Your post has been saved as a template",
      });

      setOpen(false);
      if (onTemplateSaved) onTemplateSaved();
    } catch (error: any) {
      console.error("Error saving template:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save template",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Sparkles className="w-4 h-4 mr-2" />
          Save as Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>
            Share your prompt as a template that others can remix and learn from
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Cyberpunk Character Portrait"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what makes this prompt effective..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category (optional)" />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                  — Standard —
                </div>
                {TEMPLATE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                  — Premium —
                </div>
                {PREMIUM_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    <span className="flex items-center gap-2">
                      <Crown className="w-3 h-3 text-yellow-500" />
                      {cat}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Premium Toggle */}
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                <div>
                  <Label htmlFor="premium" className="font-medium">Make Premium</Label>
                  <p className="text-xs text-muted-foreground">
                    Earn coins when users unlock your template
                  </p>
                </div>
              </div>
              <Switch
                id="premium"
                checked={isPremium}
                onCheckedChange={setIsPremium}
              />
            </div>

            {isPremium && (
              <div className="space-y-2 pt-2 border-t border-yellow-500/20">
                <Label>Unlock Cost</Label>
                <Select 
                  value={unlockCost.toString()} 
                  onValueChange={(v) => setUnlockCost(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNLOCK_COSTS.map((cost) => (
                      <SelectItem key={cost.value} value={cost.value.toString()}>
                        <span className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-yellow-500" />
                          {cost.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Coins className="w-3 h-3" />
                  You'll earn {Math.floor(unlockCost / 2)} coins per unlock (50% creator share)
                </p>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className={isPremium ? "bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600" : ""}
          >
            {saving ? "Saving..." : isPremium ? "Create Premium Template" : "Save Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveAsTemplateDialog;