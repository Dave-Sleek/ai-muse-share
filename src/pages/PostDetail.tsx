import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Heart, MessageCircle, Share2, Twitter, Facebook, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { User } from "@supabase/supabase-js";

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
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    username: string;
  };
}

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (id) {
      fetchPost();
      fetchComments();
      checkLiked();
      fetchLikeCount();
    }
  }, [id, user]);

  const fetchPost = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("*, profiles(username)")
      .eq("id", id)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Post not found",
        variant: "destructive",
      });
      navigate("/gallery");
      return;
    }
    setPost(data);
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select("*, profiles(username)")
      .eq("post_id", id)
      .order("created_at", { ascending: false });

    setComments(data || []);
  };

  const checkLiked = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    setLiked(!!data);
  };

  const fetchLikeCount = async () => {
    const { count } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", id);

    setLikeCount(count || 0);
  };

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like posts",
      });
      return;
    }

    if (liked) {
      await supabase.from("likes").delete().eq("post_id", id).eq("user_id", user.id);
      setLiked(false);
      setLikeCount((prev) => prev - 1);
    } else {
      await supabase.from("likes").insert({ post_id: id, user_id: user.id });
      setLiked(true);
      setLikeCount((prev) => prev + 1);
    }
  };

  const handleComment = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to comment",
      });
      return;
    }

    if (!newComment.trim()) return;

    const { error } = await supabase.from("comments").insert({
      post_id: id,
      user_id: user.id,
      content: newComment,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      });
      return;
    }

    setNewComment("");
    fetchComments();
    toast({
      title: "Success",
      description: "Comment posted!",
    });
  };

  const shareToSocial = (platform: string) => {
    if (!post) return;

    const text = `Check out this amazing AI art: "${post.title}"\nPrompt: ${post.prompt}`;
    const url = window.location.href;

    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    };

    if (platform === "copy") {
      navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Prompt copied to clipboard",
      });
    } else {
      window.open(urls[platform], "_blank");
    }
  };

  if (!post) {
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
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Image Section */}
            <div className="glass-effect rounded-2xl overflow-hidden">
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full aspect-square object-cover"
              />
            </div>

            {/* Details Section */}
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold mb-2">{post.title}</h1>
                <p className="text-muted-foreground">by {post.profiles.username}</p>
              </div>

              {/* Prompt */}
              <div className="glass-effect p-6 rounded-2xl">
                <h2 className="text-xl font-semibold mb-3 gradient-text">Prompt</h2>
                <p className="text-foreground leading-relaxed">{post.prompt}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <Button
                  variant={liked ? "default" : "outline"}
                  onClick={handleLike}
                  className="flex-1"
                >
                  <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
                  {likeCount}
                </Button>
                <Button variant="outline" className="flex-1">
                  <MessageCircle className="w-5 h-5" />
                  {comments.length}
                </Button>
              </div>

              {/* Share Buttons */}
              <div className="glass-effect p-4 rounded-2xl">
                <h3 className="font-semibold mb-3">Share This Prompt</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => shareToSocial("twitter")}>
                    <Twitter className="w-4 h-4" />
                    Twitter
                  </Button>
                  <Button variant="outline" onClick={() => shareToSocial("facebook")}>
                    <Facebook className="w-4 h-4" />
                    Facebook
                  </Button>
                  <Button variant="outline" onClick={() => shareToSocial("linkedin")}>
                    <Share2 className="w-4 h-4" />
                    LinkedIn
                  </Button>
                  <Button variant="outline" onClick={() => shareToSocial("copy")}>
                    <LinkIcon className="w-4 h-4" />
                    Copy
                  </Button>
                </div>
              </div>

              {/* Comments Section */}
              <div className="glass-effect p-6 rounded-2xl space-y-4">
                <h3 className="text-xl font-semibold">Comments</h3>

                {user && (
                  <div className="space-y-2">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your thoughts..."
                      className="bg-background/50"
                    />
                    <Button onClick={handleComment} variant="hero">
                      Post Comment
                    </Button>
                  </div>
                )}

                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-background/50 p-4 rounded-xl">
                      <p className="font-semibold text-sm text-primary mb-1">
                        {comment.profiles.username}
                      </p>
                      <p className="text-sm text-foreground">{comment.content}</p>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No comments yet. Be the first to comment!
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
