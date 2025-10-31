import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { Heart, MessageCircle, Eye, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

interface Post {
  id: string;
  title: string;
  prompt: string;
  image_url: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
  likes_count: number;
  comments_count: number;
  views_count: number;
  user_has_liked: boolean;
}

const Community = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchPosts();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const fetchPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Fetch all posts with user info
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select(`
          *,
          profiles:user_id (username, avatar_url)
        `)
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;

      // Fetch likes, comments, and views counts for each post
      const postsWithCounts = await Promise.all(
        (postsData || []).map(async (post) => {
          const [likesResult, commentsResult, viewsResult, userLikeResult] = await Promise.all([
            supabase.from("likes").select("*", { count: "exact", head: true }).eq("post_id", post.id),
            supabase.from("comments").select("*", { count: "exact", head: true }).eq("post_id", post.id),
            supabase.from("post_views").select("*", { count: "exact", head: true }).eq("post_id", post.id),
            user ? supabase.from("likes").select("*").eq("post_id", post.id).eq("user_id", user.id).single() : null,
          ]);

          return {
            ...post,
            likes_count: likesResult.count || 0,
            comments_count: commentsResult.count || 0,
            views_count: viewsResult.count || 0,
            user_has_liked: !!userLikeResult?.data,
          };
        })
      );

      setPosts(postsWithCounts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast({
        title: "Error",
        description: "Failed to load community posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string, currentlyLiked: boolean) => {
    if (!currentUser) {
      navigate("/auth");
      return;
    }

    try {
      if (currentlyLiked) {
        await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", currentUser.id);
      } else {
        await supabase.from("likes").insert({ post_id: postId, user_id: currentUser.id });
      }
      fetchPosts();
    } catch (error) {
      console.error("Error toggling like:", error);
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Community</h1>
          <p className="text-muted-foreground mb-8">
            Explore what the community is creating with AI
          </p>

          {posts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4">No posts yet</p>
                <Button onClick={() => navigate("/create")}>Create First Post</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.map((post) => (
                <Card
                  key={post.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => navigate(`/post/${post.id}`)}
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-1">{post.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{post.prompt}</p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2 h-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(post.id, post.user_has_liked);
                          }}
                        >
                          <Heart
                            className={`h-4 w-4 ${post.user_has_liked ? "fill-red-500 text-red-500" : ""}`}
                          />
                          {post.likes_count}
                        </Button>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <MessageCircle className="h-4 w-4" />
                          {post.comments_count}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Eye className="h-4 w-4" />
                          {post.views_count}
                        </span>
                      </div>
                      <Link 
                        to={`/profile/${post.user_id}`}
                        className="text-muted-foreground hover:text-primary transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        @{post.profiles.username}
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Community;
