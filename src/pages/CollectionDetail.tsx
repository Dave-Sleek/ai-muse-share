import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Globe, Lock, Trash2, Heart, MessageCircle, Eye } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Collection {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
}

interface Post {
  id: string;
  title: string;
  image_url: string;
  prompt: string;
  bookmark_id: string;
  profiles: {
    username: string;
  };
  likes_count: number;
  comments_count: number;
  views_count: number;
}

const CollectionDetail = () => {
  const { id } = useParams();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchCollectionAndPosts();
  }, [id]);

  const fetchCollectionAndPosts = async () => {
    const { data: collectionData } = await supabase
      .from("collections")
      .select("*")
      .eq("id", id)
      .single();

    if (collectionData) {
      setCollection(collectionData);
    }

    const { data: bookmarksData } = await supabase
      .from("bookmarks")
      .select(`
        id,
        posts (
          id,
          title,
          image_url,
          prompt,
          profiles(username)
        )
      `)
      .eq("collection_id", id);

    if (bookmarksData) {
      const postsData = await Promise.all(
        bookmarksData.map(async (bookmark: any) => {
          const post = bookmark.posts;
          
          const { count: likesCount } = await supabase
            .from("likes")
            .select("*", { count: "exact", head: true })
            .eq("post_id", post.id);

          const { count: commentsCount } = await supabase
            .from("comments")
            .select("*", { count: "exact", head: true })
            .eq("post_id", post.id);

          const { count: viewsCount } = await supabase
            .from("post_views")
            .select("*", { count: "exact", head: true })
            .eq("post_id", post.id);

          return {
            ...post,
            bookmark_id: bookmark.id,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            views_count: viewsCount || 0,
          };
        })
      );
      setPosts(postsData);
    }
    setLoading(false);
  };

  const handleRemoveBookmark = async (bookmarkId: string) => {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", bookmarkId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove bookmark",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Post removed from collection",
      });
      fetchCollectionAndPosts();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Collection not found</h2>
            <Button onClick={() => navigate("/collections")}>
              Back to Collections
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/collections")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Collections
          </Button>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-4xl font-bold">{collection.name}</h1>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                {collection.is_public ? (
                  <>
                    <Globe className="w-4 h-4" />
                    Public
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Private
                  </>
                )}
              </span>
            </div>
            {collection.description && (
              <p className="text-muted-foreground">{collection.description}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              {posts.length} {posts.length === 1 ? "post" : "posts"}
            </p>
          </div>

          {posts.length === 0 ? (
            <div className="glass-effect rounded-2xl p-12 text-center">
              <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
              <p className="text-muted-foreground mb-4">
                Start bookmarking posts to add them to this collection
              </p>
              <Button onClick={() => navigate("/gallery")}>
                Browse Gallery
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="glass-effect rounded-2xl overflow-hidden group"
                >
                  <div
                    className="aspect-square relative overflow-hidden cursor-pointer"
                    onClick={() => navigate(`/post/${post.id}`)}
                  >
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1 truncate">
                      {post.title}
                    </h3>
                    <Link
                      to={`/profile/${post.profiles.username}`}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      by {post.profiles.username}
                    </Link>
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {post.likes_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {post.comments_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {post.views_count}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => handleRemoveBookmark(post.bookmark_id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove from collection
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CollectionDetail;