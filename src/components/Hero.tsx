import { Button } from "@/components/ui/button";
import { Sparkles, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Hero = () => {
  const [stats, setStats] = useState({
    posts: 0,
    users: 0,
    likes: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [postsResult, usersResult, likesResult] = await Promise.all([
        supabase.from("posts").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("likes").select("*", { count: "exact", head: true }),
      ]);

      setStats({
        posts: postsResult.count || 0,
        users: usersResult.count || 0,
        likes: likesResult.count || 0,
      });
    };

    fetchStats();
  }, []);
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroBg} 
          alt="Hero background" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />
      </div>

      {/* Floating gradient orbs */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 mb-8 animate-fade-in">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">Discover AI-Generated Masterpieces</span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 text-foreground animate-fade-in" style={{ animationDelay: "0.1s" }}>
          Share Your{" "}
          <span className="gradient-text inline-block">AI Art</span>
          <br />
          With the World
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
          Post your AI-generated images, share prompts, and connect with a creative community
          passionate about the future of digital art.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <Link to="/gallery">
            <Button variant="hero" size="xl" className="w-full sm:w-auto">
              <Zap className="w-5 h-5" />
              Explore Gallery
            </Button>
          </Link>
          <Link to="/auth">
            <Button variant="glass" size="xl" className="w-full sm:w-auto">
              Get Started Free
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-20 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <div className="glass-effect p-6 rounded-2xl">
            <div className="text-3xl md:text-4xl font-bold gradient-text inline-block mb-2">
              {stats.posts.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">AI Images</div>
          </div>
          <div className="glass-effect p-6 rounded-2xl">
            <div className="text-3xl md:text-4xl font-bold gradient-text inline-block mb-2">
              {stats.users.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Creators</div>
          </div>
          <div className="glass-effect p-6 rounded-2xl">
            <div className="text-3xl md:text-4xl font-bold gradient-text inline-block mb-2">
              {stats.likes.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Likes</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
