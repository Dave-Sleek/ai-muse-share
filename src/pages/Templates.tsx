import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Copy, Users, Lock, Unlock, Crown, Coins } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { CoinBalance } from "@/components/CoinBalance";

interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  use_count: number;
  created_at: string;
  post_id: string;
  user_id: string;
  is_premium: boolean;
  unlock_cost: number;
  posts: {
    id: string;
    title: string;
    image_url: string;
    prompt: string;
    ai_model: string | null;
  };
  profiles: {
    username: string;
    avatar_url: string | null;
  };
  isUnlocked?: boolean;
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

const Templates: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [premiumFilter, setPremiumFilter] = useState<string>("all");
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    fetchTemplates();
  }, [categoryFilter, premiumFilter]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setCurrentUserId(session?.user?.id || null);
  };

  const fetchTemplates = async () => {
    setLoading(true);
    
    let query = supabase
      .from("prompt_templates")
      .select(`
        id,
        name,
        description,
        category,
        use_count,
        created_at,
        post_id,
        user_id,
        is_premium,
        unlock_cost
      `)
      .eq("is_public", true)
      .order("is_premium", { ascending: false })
      .order("use_count", { ascending: false });

    if (categoryFilter !== "all") {
      query = query.eq("category", categoryFilter);
    }

    if (premiumFilter === "premium") {
      query = query.eq("is_premium", true);
    } else if (premiumFilter === "free") {
      query = query.eq("is_premium", false);
    }

    const { data: templatesData, error } = await query;

    if (error) {
      console.error("Error fetching templates:", error);
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (!templatesData || templatesData.length === 0) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    // Fetch related posts and profiles
    const postIds = templatesData.map(t => t.post_id);
    const userIds = templatesData.map(t => t.user_id);
    const templateIds = templatesData.map(t => t.id);

    // Get current user's unlocks
    const { data: { session } } = await supabase.auth.getSession();
    let unlockedTemplateIds: string[] = [];

    if (session?.user?.id) {
      const { data: unlocks } = await supabase
        .from("template_unlocks")
        .select("template_id")
        .eq("user_id", session.user.id)
        .in("template_id", templateIds);
      
      unlockedTemplateIds = unlocks?.map(u => u.template_id) || [];
    }

    const [{ data: postsData }, { data: profilesData }] = await Promise.all([
      supabase.from("posts").select("id, title, image_url, prompt, ai_model").in("id", postIds),
      supabase.from("profiles").select("id, username, avatar_url").in("id", userIds),
    ]);

    // Merge the data
    const enrichedTemplates = templatesData.map(template => ({
      ...template,
      posts: postsData?.find(p => p.id === template.post_id) || {
        id: template.post_id,
        title: "",
        image_url: "",
        prompt: "",
        ai_model: null,
      },
      profiles: profilesData?.find(p => p.id === template.user_id) || {
        username: "Unknown",
        avatar_url: null,
      },
      isUnlocked: !template.is_premium || unlockedTemplateIds.includes(template.id) || template.user_id === session?.user?.id,
    }));

    setTemplates(enrichedTemplates);
    setLoading(false);
  };

  const handleUnlock = async (template: Template) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please sign in to unlock premium templates",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setUnlocking(template.id);

    try {
      const { data, error } = await supabase.rpc("unlock_template", {
        p_template_id: template.id
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; coins_spent?: number };

      if (result.success) {
        toast({
          title: "Template Unlocked! 🎉",
          description: `You spent ${result.coins_spent} coins to unlock this template`,
        });
        // Refresh templates to update unlock status
        fetchTemplates();
      } else {
        toast({
          title: "Cannot unlock template",
          description: result.error || "An error occurred",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error unlocking template:", error);
      toast({
        title: "Error",
        description: "Failed to unlock template",
        variant: "destructive",
      });
    } finally {
      setUnlocking(null);
    }
  };

  const handleRemix = async (template: Template) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please sign in to remix templates",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (template.is_premium && !template.isUnlocked) {
      toast({
        title: "Premium template",
        description: "Please unlock this template first",
        variant: "destructive",
      });
      return;
    }

    // Increment use count
    await supabase
      .from("prompt_templates")
      .update({ use_count: template.use_count + 1 })
      .eq("id", template.id);

    // Navigate to create post with template data pre-filled
    navigate("/create", {
      state: {
        templateId: template.id,
        prompt: template.posts.prompt,
        title: `Remix: ${template.posts.title}`,
        aiModel: template.posts.ai_model,
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Prompt Templates</h1>
            <p className="text-muted-foreground mb-4">
              Discover and remix successful prompts from the community
            </p>
            {currentUserId && (
              <div className="flex justify-center">
                <CoinBalance />
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <Select value={premiumFilter} onValueChange={setPremiumFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Templates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Templates</SelectItem>
                <SelectItem value="free">Free Templates</SelectItem>
                <SelectItem value="premium">
                  <span className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    Premium Templates
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
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

          {/* Templates Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-48 w-full rounded-lg" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : templates.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">No templates found for this category</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card 
                  key={template.id} 
                  className={`group hover:shadow-lg transition-shadow relative ${
                    template.is_premium ? 'ring-2 ring-yellow-500/30 bg-gradient-to-b from-yellow-500/5 to-transparent' : ''
                  }`}
                >
                  {template.is_premium && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0 shadow-lg">
                        <Crown className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg flex items-start justify-between">
                      <span className="line-clamp-2">{template.name}</span>
                      {template.category && (
                        <Badge variant="secondary" className="ml-2 shrink-0">
                          {template.category}
                        </Badge>
                      )}
                    </CardTitle>
                    {template.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {template.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <Link to={`/post/${template.posts.id}`}>
                        <img
                          src={template.posts.image_url}
                          alt={template.posts.title}
                          className={`w-full h-48 object-cover rounded-lg transition-all ${
                            template.is_premium && !template.isUnlocked 
                              ? 'blur-sm brightness-75' 
                              : 'group-hover:opacity-90'
                          }`}
                        />
                      </Link>
                      {template.is_premium && !template.isUnlocked && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-background/90 backdrop-blur-sm rounded-full p-4 shadow-lg">
                            <Lock className="w-8 h-8 text-yellow-500" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>Used {template.use_count} times</span>
                        </div>
                        {template.is_premium && (
                          <div className="flex items-center gap-1 text-yellow-500 font-medium">
                            <Coins className="w-4 h-4" />
                            <span>{template.unlock_cost}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        by {template.profiles.username}
                      </div>
                      {template.posts.ai_model && (
                        <Badge variant="outline">{template.posts.ai_model}</Badge>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    {template.is_premium && !template.isUnlocked ? (
                      <Button
                        variant="default"
                        className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600"
                        onClick={() => handleUnlock(template)}
                        disabled={unlocking === template.id}
                      >
                        {unlocking === template.id ? (
                          <>Unlocking...</>
                        ) : (
                          <>
                            <Unlock className="w-4 h-4 mr-2" />
                            Unlock for {template.unlock_cost} coins
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        className="flex-1"
                        onClick={() => handleRemix(template)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Remix
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      asChild
                    >
                      <Link to={`/post/${template.posts.id}`}>View</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Templates;