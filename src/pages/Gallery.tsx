import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart, MessageCircle, Share2, Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import BookmarkButton from "@/components/BookmarkButton";

interface Post {
  id: string;
  title: string;
  prompt: string;
  image_url: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
  };
  likes: { id: string }[];
  comments: { id: string }[];
  post_views: { id: string }[];
}

const Gallery = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredPosts(posts);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = posts.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.prompt.toLowerCase().includes(query) ||
          post.profiles.username.toLowerCase().includes(query)
      );
      setFilteredPosts(filtered);
    }
  }, [searchQuery, posts]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          profiles(username),
          likes(id),
          comments(id),
          post_views(id)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
      setFilteredPosts(data || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast({
        title: "Error",
        description: "Failed to load gallery",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sharePrompt = (prompt: string, title: string) => {
    const text = `Check out this AI prompt: "${prompt}"`;
    if (navigator.share) {
      navigator.share({
        title: title,
        text: text,
      });
    } else {
      navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Prompt copied to clipboard",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Discover <span className="gradient-text">AI Masterpieces</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              Explore prompts and creations from our creative community
            </p>
            
            {/* Search Bar */}
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by title, prompt, or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50 border-border"
                />
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post, index) => (
              <div
                key={post.id}
                className="glass-effect rounded-2xl overflow-hidden hover-lift group"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <Link to={`/post/${post.id}`}>
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </Link>

                <div className="p-4">
                  <Link to={`/post/${post.id}`}>
                    <h3 className="font-semibold text-lg mb-2 hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {post.prompt}
                  </p>

                  <div className="flex items-center justify-between mb-3">
                    <Link 
                      to={`/profile/${post.user_id}`}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      by {post.profiles.username}
                    </Link>
                    <div className="flex items-center gap-3">
                      <button className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                        <Heart className="w-4 h-4" />
                        <span className="text-sm">{post.likes.length}</span>
                      </button>
                      <button className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm">{post.comments.length}</span>
                      </button>
                      <button className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                        <Eye className="w-4 h-4" />
                        <span className="text-sm">{post.post_views.length}</span>
                      </button>
                      <button
                        onClick={() => sharePrompt(post.prompt, post.title)}
                        className="flex items-center gap-1 text-muted-foreground hover:text-secondary transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <BookmarkButton postId={post.id} variant="outline" size="sm" showLabel={false} />
                </div>
              </div>
            ))}
          </div>

          {posts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                No posts yet. Be the first to share your AI art!
              </p>
            </div>
          )}

          {posts.length > 0 && filteredPosts.length === 0 && (
            <div className="text-center py-12 col-span-full">
              <p className="text-muted-foreground text-lg">
                No posts found matching "{searchQuery}"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Gallery;
