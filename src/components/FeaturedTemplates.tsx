import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Coins, Sparkles, Lock } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  unlock_cost: number;
  use_count: number;
  post: {
    id: string;
    title: string;
    image_url: string;
    prompt: string;
  };
  creator: {
    username: string;
  };
}

const FeaturedTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedTemplates();
  }, []);

  const fetchFeaturedTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("prompt_templates")
        .select(`
          id,
          name,
          description,
          category,
          unlock_cost,
          use_count,
          post:posts!prompt_templates_post_id_fkey(
            id,
            title,
            image_url,
            prompt
          ),
          creator:profiles!prompt_templates_user_id_fkey(
            username
          )
        `)
        .eq("is_premium", true)
        .eq("is_public", true)
        .order("use_count", { ascending: false })
        .limit(8);

      if (!error && data) {
        const formattedData = data
          .filter((t) => t.post && t.creator)
          .map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            category: t.category,
            unlock_cost: t.unlock_cost,
            use_count: t.use_count,
            post: Array.isArray(t.post) ? t.post[0] : t.post,
            creator: Array.isArray(t.creator) ? t.creator[0] : t.creator,
          }));
        setTemplates(formattedData as Template[]);
      }
    } catch (error) {
      console.error("Error fetching featured templates:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || templates.length === 0) {
    return null;
  }

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-10 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-secondary/5 rounded-full blur-3xl" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Crown className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Premium Collection</span>
          </div>
          <h2 className="text-4xl font-bold mb-4">
            Featured <span className="gradient-text">Templates</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Unlock premium prompts from top creators and elevate your AI art with proven techniques
          </p>
        </div>

        <Carousel className="w-full">
          <CarouselContent className="-ml-4">
            {templates.map((template) => (
              <CarouselItem key={template.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                <div className="glass-effect rounded-2xl overflow-hidden group relative">
                  {/* Premium badge overlay */}
                  <div className="absolute top-3 left-3 z-20">
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg">
                      <Crown className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  </div>
                  
                  {/* Lock overlay */}
                  <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="text-center p-4">
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">Unlock this template</p>
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <Coins className="w-5 h-5 text-amber-500" />
                        <span className="text-xl font-bold">{template.unlock_cost}</span>
                        <span className="text-sm text-muted-foreground">coins</span>
                      </div>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                        onClick={() => navigate("/templates")}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        View Templates
                      </Button>
                    </div>
                  </div>

                  {/* Image */}
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={template.post.image_url}
                      alt={template.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="p-4 relative">
                    <div className="flex items-center gap-2 mb-2">
                      {template.category && (
                        <Badge variant="secondary" className="text-xs">
                          {template.category}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {template.use_count} uses
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg mb-1 truncate">
                      {template.name}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      by {template.creator.username}
                    </p>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>

        <div className="text-center mt-10">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("/templates")}
            className="border-primary/50 hover:bg-primary/10"
          >
            <Crown className="w-5 h-5 mr-2" />
            Browse All Templates
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedTemplates;