import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Copy, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  use_count: number;
  created_at: string;
  post_id: string;
  user_id: string;
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

const Templates: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, [categoryFilter]);

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
        user_id
      `)
      .eq("is_public", true)
      .order("use_count", { ascending: false });

    if (categoryFilter !== "all") {
      query = query.eq("category", categoryFilter);
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

    // Fetch related posts and profiles separately
    const postIds = templatesData.map(t => t.post_id);
    const userIds = templatesData.map(t => t.user_id);

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
    }));

    setTemplates(enrichedTemplates);
    setLoading(false);
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
            <p className="text-muted-foreground">
              Discover and remix successful prompts from the community
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex justify-center mb-8">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {TEMPLATE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
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
                <Card key={template.id} className="group hover:shadow-lg transition-shadow">
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
                    <Link to={`/post/${template.posts.id}`}>
                      <img
                        src={template.posts.image_url}
                        alt={template.posts.title}
                        className="w-full h-48 object-cover rounded-lg group-hover:opacity-90 transition-opacity"
                      />
                    </Link>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>Used {template.use_count} times</span>
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
                    <Button
                      variant="default"
                      className="flex-1"
                      onClick={() => handleRemix(template)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Remix
                    </Button>
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
