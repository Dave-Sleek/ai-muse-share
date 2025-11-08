import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart, MessageCircle, Share2, Search, Eye, Filter, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import BookmarkButton from "@/components/BookmarkButton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface Post {
  id: string;
  title: string;
  prompt: string;
  image_url: string;
  created_at: string;
  user_id: string;
  tags: string[];
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
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "popular">("newest");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [allTags, setAllTags] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    let filtered = [...posts];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.prompt.toLowerCase().includes(query) ||
          post.profiles.username.toLowerCase().includes(query) ||
          post.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Tag filter
    if (selectedTag) {
      filtered = filtered.filter(post => post.tags?.includes(selectedTag));
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const cutoff = new Date();
      
      if (dateFilter === "today") {
        cutoff.setHours(0, 0, 0, 0);
      } else if (dateFilter === "week") {
        cutoff.setDate(now.getDate() - 7);
      } else if (dateFilter === "month") {
        cutoff.setMonth(now.getMonth() - 1);
      }
      
      filtered = filtered.filter(post => new Date(post.created_at) >= cutoff);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else {
        // popularity = likes + comments + views
        const aScore = a.likes.length + a.comments.length + a.post_views.length;
        const bScore = b.likes.length + b.comments.length + b.post_views.length;
        return bScore - aScore;
      }
    });

    setFilteredPosts(filtered);
  }, [searchQuery, posts, sortBy, selectedTag, dateFilter]);

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

      // Extract all unique tags
      const tags = new Set<string>();
      data?.forEach(post => {
        post.tags?.forEach((tag: string) => tags.add(tag));
      });
      setAllTags(Array.from(tags).sort());
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
          <div className="mb-8">
            <div className="text-center mb-6">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Discover <span className="gradient-text">AI Masterpieces</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Explore prompts and creations from our creative community
              </p>
            </div>
            
            {/* Search & Filters */}
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by title, prompt, tags, or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50 border-border"
                />
              </div>

              {/* Filters Row */}
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex flex-wrap gap-3 items-center">
                  {/* Sort By */}
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-[160px] bg-background/50">
                      <SlidersHorizontal className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Date Filter */}
                  <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
                    <SelectTrigger className="w-[140px] bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Tag Filter */}
                  {allTags.length > 0 && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="bg-background/50">
                          <Filter className="w-4 h-4 mr-2" />
                          {selectedTag || "Filter by Tag"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-3">
                          <Label>Filter by Category</Label>
                          <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto">
                            <Badge
                              variant={selectedTag === "" ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() => setSelectedTag("")}
                            >
                              All
                            </Badge>
                            {allTags.map((tag) => (
                              <Badge
                                key={tag}
                                variant={selectedTag === tag ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => setSelectedTag(tag)}
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>

                {/* Active filters count */}
                <div className="text-sm text-muted-foreground">
                  {filteredPosts.length} {filteredPosts.length === 1 ? "result" : "results"}
                </div>
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

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {post.tags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedTag(tag);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          {tag}
                        </Badge>
                      ))}
                      {post.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{post.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

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
