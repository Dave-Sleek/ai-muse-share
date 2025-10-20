import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Share2, ArrowLeft, Loader2, Edit, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { commentSchema } from "@/lib/validation";

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
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPost();
    fetchComments();
    checkIfLiked();
    fetchLikeCount();
    fetchViewCount();
    trackView();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setCurrentUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, [id]);

  const trackView = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase
      .from("post_views")
      .insert({ 
        post_id: id, 
        user_id: user?.id || null 
      })
      .select()
      .maybeSingle();
  };

  useEffect(() => {
    const channel = supabase
      .channel(`post-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${id}`,
        },
        () => {
          fetchComments();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "likes",
          filter: `post_id=eq.${id}`,
        },
        () => {
          fetchLikeCount();
          checkIfLiked();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const fetchPost = async () => {
    setLoading(true);
    const { data: postData, error: postError } = await supabase
      .from("posts")
      .select("*")
      .eq("id", id)
      .single();

    if (postError) {
      console.error("Error fetching post:", postError);
      toast({
        title: "Error",
        description: "Failed to load post",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (postData) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", postData.user_id)
        .single();

      setPost({
        ...postData,
        profiles: profile || { username: "Unknown" },
      });
    }
    setLoading(false);
  };

  const fetchComments = async () => {
    const { data: commentsData, error } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", id)
      .order("created_at", { ascending: false });

    if (!error && commentsData) {
      const enrichedComments = await Promise.all(
        commentsData.map(async (comment) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", comment.user_id)
            .single();

          return {
            ...comment,
            profiles: profile || { username: "Unknown" },
          };
        })
      );
      setComments(enrichedComments);
    }
  };

  const checkIfLiked = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    setIsLiked(!!data);
  };

  const fetchLikeCount = async () => {
    const { count } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", id);

    setLikeCount(count || 0);
  };

  const fetchViewCount = async () => {
    const { count } = await supabase
      .from("post_views")
      .select("*", { count: "exact", head: true })
      .eq("post_id", id);

    setViewCount(count || 0);
  };

  const handleLike = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to like posts",
      });
      navigate("/auth");
      return;
    }

    if (isLiked) {
      await supabase
        .from("likes")
        .delete()
        .eq("post_id", id)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("likes")
        .insert({ post_id: id, user_id: user.id });
    }
  };

  const handleComment = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to comment",
      });
      navigate("/auth");
      return;
    }

    if (!newComment.trim()) return;

    // Validate comment
    const commentResult = commentSchema.safeParse(newComment);
    if (!commentResult.success) {
      toast({
        title: "Invalid comment",
        description: commentResult.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("comments")
      .insert({ post_id: id, user_id: user.id, content: newComment });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      });
    } else {
      setNewComment("");
      toast({
        title: "Success",
        description: "Comment posted successfully",
      });
    }
  };

  const shareToSocial = (platform: string) => {
    const url = window.location.href;
    const text = `Check out this AI art: ${post?.title}`;

    const urls: { [key: string]: string } = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    };

    if (platform === "copy") {
      navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "Post link copied to clipboard",
      });
    } else {
      window.open(urls[platform], "_blank");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Post not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 mt-16">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="glass-effect rounded-2xl overflow-hidden">
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full h-[500px] object-cover"
          />
          <div className="p-6">
            <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
            <p className="text-muted-foreground mb-4">
              by {post.profiles.username}
            </p>
            <p className="text-lg mb-6">{post.prompt}</p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4 flex-wrap">
                <Button
                  variant={isLiked ? "default" : "outline"}
                  size="sm"
                  onClick={handleLike}
                >
                  <Heart className={`w-4 h-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
                  {likeCount} Likes
                </Button>
                <Button variant="outline" size="sm">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {comments.length} Comments
                </Button>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  {viewCount} Views
                </Button>
              </div>
              
              {currentUser && post.user_id === currentUser.id && (
                <Link to={`/edit/${post.id}`}>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Post
                  </Button>
                </Link>
              )}
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-2">Share this post</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareToSocial("twitter")}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Twitter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareToSocial("facebook")}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareToSocial("linkedin")}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  LinkedIn
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareToSocial("copy")}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-xl font-semibold mb-4">Comments</h3>
              {currentUser ? (
                <div className="mb-6">
                  <Textarea
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="mb-2"
                  />
                  <Button onClick={handleComment}>Post Comment</Button>
                </div>
              ) : (
                <p className="text-muted-foreground mb-6">
                  Please log in to comment
                </p>
              )}

              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="glass-effect p-4 rounded-lg">
                    <p className="font-medium mb-1">
                      {comment.profiles.username}
                    </p>
                    <p className="text-sm text-muted-foreground mb-2">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </p>
                    <p>{comment.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PostDetail;