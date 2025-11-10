import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2, ArrowLeft, Loader2, Edit, Eye, Reply, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
// import Footer from "@/components/Footer";
import { commentSchema } from "@/lib/validation";
import BookmarkButton from "@/components/BookmarkButton";
import SaveAsTemplateDialog from "@/components/SaveAsTemplateDialog";

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
  user_id: string;
  parent_comment_id: string | null;
  profiles: {
    username: string;
  };
  likeCount?: number;
  isLiked?: boolean;
  replies?: Comment[];
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
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isTemplate, setIsTemplate] = useState(false);
  const [templateInfo, setTemplateInfo] = useState<any>(null);
  const [remixInfo, setRemixInfo] = useState<any>(null);

  useEffect(() => {
    fetchPost();
    fetchComments();
    checkIfLiked();
    fetchLikeCount();
    fetchViewCount();
    fetchTemplateInfo();
    fetchRemixInfo();
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
      .is("parent_comment_id", null)
      .order("created_at", { ascending: false });

    if (!error && commentsData) {
      const enrichedComments = await Promise.all(
        commentsData.map(async (comment) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", comment.user_id)
            .single();

          // Fetch replies
          const { data: repliesData } = await supabase
            .from("comments")
            .select("*")
            .eq("parent_comment_id", comment.id)
            .order("created_at", { ascending: true });

          const enrichedReplies = repliesData ? await Promise.all(
            repliesData.map(async (reply) => {
              const { data: replyProfile } = await supabase
                .from("profiles")
                .select("username")
                .eq("id", reply.user_id)
                .single();

              const likeCount = await fetchCommentLikeCount(reply.id);
              const isLiked = await checkIfCommentLiked(reply.id);

              return {
                ...reply,
                profiles: replyProfile || { username: "Unknown" },
                likeCount,
                isLiked,
              };
            })
          ) : [];

          const likeCount = await fetchCommentLikeCount(comment.id);
          const isLiked = await checkIfCommentLiked(comment.id);

          return {
            ...comment,
            profiles: profile || { username: "Unknown" },
            replies: enrichedReplies,
            likeCount,
            isLiked,
          };
        })
      );
      setComments(enrichedComments);
    }
  };

  const fetchCommentLikeCount = async (commentId: string) => {
    const { count } = await supabase
      .from("comment_likes")
      .select("*", { count: "exact", head: true })
      .eq("comment_id", commentId);
    return count || 0;
  };

  const checkIfCommentLiked = async (commentId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from("comment_likes")
      .select("id")
      .eq("comment_id", commentId)
      .eq("user_id", user.id)
      .maybeSingle();

    return !!data;
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

  const fetchTemplateInfo = async () => {
    const { data } = await supabase
      .from("prompt_templates")
      .select("*")
      .eq("post_id", id)
      .maybeSingle();

    if (data) {
      setIsTemplate(true);
      setTemplateInfo(data);
    }
  };

  const fetchRemixInfo = async () => {
    const { data } = await supabase
      .from("post_remixes")
      .select(`
        *,
        prompt_templates (
          id,
          name,
          posts (
            id,
            title
          )
        )
      `)
      .eq("post_id", id)
      .maybeSingle();

    if (data) {
      setRemixInfo(data);
    }
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

  const handleCommentLike = async (commentId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to like comments",
      });
      navigate("/auth");
      return;
    }

    const comment = comments.find(c => c.id === commentId || c.replies?.find(r => r.id === commentId));
    const targetComment = comment?.id === commentId ? comment : comment?.replies?.find(r => r.id === commentId);

    if (targetComment?.isLiked) {
      await supabase
        .from("comment_likes")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("comment_likes")
        .insert({ comment_id: commentId, user_id: user.id });
    }

    fetchComments();
  };

  const handleReply = async (parentCommentId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to reply",
      });
      navigate("/auth");
      return;
    }

    if (!replyContent.trim()) return;

    const commentResult = commentSchema.safeParse(replyContent);
    if (!commentResult.success) {
      toast({
        title: "Invalid reply",
        description: commentResult.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("comments")
      .insert({
        post_id: id,
        user_id: user.id,
        content: replyContent,
        parent_comment_id: parentCommentId
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to post reply",
        variant: "destructive",
      });
    } else {
      setReplyContent("");
      setReplyingTo(null);
      toast({
        title: "Success",
        description: "Reply posted successfully",
      });
      fetchComments();
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
            <div className="flex items-center gap-2 mb-4">
              <p className="text-muted-foreground">
                by{" "}
                <Link
                  to={`/profile/${post.user_id}`}
                  className="hover:text-primary transition-colors hover:underline"
                >
                  {post.profiles.username}
                </Link>
              </p>
              {isTemplate && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Template
                </Badge>
              )}
              {remixInfo && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Remixed from{" "}
                  <Link
                    to={`/post/${remixInfo.prompt_templates.posts.id}`}
                    className="underline ml-1"
                  >
                    {remixInfo.prompt_templates.name}
                  </Link>
                </Badge>
              )}
            </div>
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
                <BookmarkButton postId={post.id} variant="outline" size="sm" />
              </div>

              <div className="flex items-center gap-2">
                {currentUser && post.user_id === currentUser.id && (
                  <>
                    <Link to={`/edit/${post.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Post
                      </Button>
                    </Link>
                    {!isTemplate && (
                      <SaveAsTemplateDialog
                        postId={post.id}
                        postTitle={post.title}
                        userId={currentUser.id}
                        onTemplateSaved={fetchTemplateInfo}
                      />
                    )}
                  </>
                )}
              </div>
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
                  <div key={comment.id} className="space-y-3">
                    <div className="glass-effect p-4 rounded-lg">
                      <Link
                        to={`/profile/${comment.user_id}`}
                        className="font-medium mb-1 hover:text-primary transition-colors hover:underline block"
                      >
                        {comment.profiles.username}
                      </Link>
                      <p className="text-sm text-muted-foreground mb-2">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </p>
                      <p className="mb-3">{comment.content}</p>

                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCommentLike(comment.id)}
                          className="h-8"
                        >
                          <Heart className={`w-3 h-3 mr-1 ${comment.isLiked ? "fill-current text-primary" : ""}`} />
                          {comment.likeCount || 0}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                          className="h-8"
                        >
                          <Reply className="w-3 h-3 mr-1" />
                          Reply
                        </Button>
                      </div>

                      {replyingTo === comment.id && currentUser && (
                        <div className="mt-3 pl-4 border-l-2">
                          <Textarea
                            placeholder="Write a reply..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="mb-2"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleReply(comment.id)}>
                              Post Reply
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                              setReplyingTo(null);
                              setReplyContent("");
                            }}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-8 space-y-3">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="glass-effect p-4 rounded-lg">
                            <Link
                              to={`/profile/${reply.user_id}`}
                              className="font-medium mb-1 hover:text-primary transition-colors hover:underline block"
                            >
                              {reply.profiles.username}
                            </Link>
                            <p className="text-sm text-muted-foreground mb-2">
                              {new Date(reply.created_at).toLocaleDateString()}
                            </p>
                            <p className="mb-3">{reply.content}</p>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCommentLike(reply.id)}
                              className="h-8"
                            >
                              <Heart className={`w-3 h-3 mr-1 ${reply.isLiked ? "fill-current text-primary" : ""}`} />
                              {reply.likeCount || 0}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* <Footer /> */}
    </div>
  );
};

export default PostDetail;