import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Heart, Eye, MessageSquare, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface TrendingPost {
  id: string;
  title: string;
  image_url: string;
  user_id: string;
  likes_count: number;
  views_count: number;
  comments_count: number;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

interface TopCreator {
  id: string;
  username: string;
  avatar_url: string | null;
  total_likes: number;
  total_posts: number;
  followers_count: number;
}

const Leaderboards = () => {
  const [timeFilter, setTimeFilter] = useState<"week" | "month" | "all">("week");
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([]);
  const [topCreators, setTopCreators] = useState<TopCreator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboardData();
  }, [timeFilter]);

  const getTimeFilterDate = () => {
    const now = new Date();
    switch (timeFilter) {
      case "week":
        return new Date(now.setDate(now.getDate() - 7)).toISOString();
      case "month":
        return new Date(now.setMonth(now.getMonth() - 1)).toISOString();
      case "all":
        return new Date(0).toISOString();
    }
  };

  const fetchLeaderboardData = async () => {
    setLoading(true);
    const filterDate = getTimeFilterDate();

    // Fetch trending posts
    const { data: postsData } = await supabase
      .from("posts")
      .select(`
        id,
        title,
        image_url,
        user_id,
        created_at,
        profiles:user_id (username, avatar_url)
      `)
      .gte("created_at", filterDate)
      .order("created_at", { ascending: false })
      .limit(100);

    if (postsData) {
      // Get engagement counts for each post
      const postsWithEngagement = await Promise.all(
        postsData.map(async (post) => {
          const [{ count: likesCount }, { count: viewsCount }, { count: commentsCount }] = await Promise.all([
            supabase.from("likes").select("*", { count: "exact", head: true }).eq("post_id", post.id),
            supabase.from("post_views").select("*", { count: "exact", head: true }).eq("post_id", post.id),
            supabase.from("comments").select("*", { count: "exact", head: true }).eq("post_id", post.id),
          ]);

          return {
            ...post,
            likes_count: likesCount || 0,
            views_count: viewsCount || 0,
            comments_count: commentsCount || 0,
          };
        })
      );

      // Sort by engagement score (likes * 3 + comments * 2 + views)
      const sorted = postsWithEngagement.sort((a, b) => {
        const scoreA = a.likes_count * 3 + a.comments_count * 2 + a.views_count;
        const scoreB = b.likes_count * 3 + b.comments_count * 2 + b.views_count;
        return scoreB - scoreA;
      });

      setTrendingPosts(sorted.slice(0, 10));
    }

    // Fetch top creators
    const { data: creatorsData } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .limit(100);

    if (creatorsData) {
      const creatorsWithStats = await Promise.all(
        creatorsData.map(async (creator) => {
          // Get posts in time period
          const { data: userPosts } = await supabase
            .from("posts")
            .select("id")
            .eq("user_id", creator.id)
            .gte("created_at", filterDate);

          const postIds = userPosts?.map((p) => p.id) || [];

          // Get total likes on their posts
          const { count: totalLikes } = await supabase
            .from("likes")
            .select("*", { count: "exact", head: true })
            .in("post_id", postIds.length > 0 ? postIds : ["none"]);

          // Get followers count
          const { count: followersCount } = await supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("following_id", creator.id);

          return {
            ...creator,
            total_likes: totalLikes || 0,
            total_posts: postIds.length,
            followers_count: followersCount || 0,
          };
        })
      );

      // Sort by total likes
      const sorted = creatorsWithStats.sort((a, b) => b.total_likes - a.total_likes);
      setTopCreators(sorted.slice(0, 10));
    }

    setLoading(false);
  };

  const getRankBadge = (rank: number) => {
    if (rank === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 1) return <Trophy className="w-5 h-5 text-gray-400" />;
    if (rank === 2) return <Trophy className="w-5 h-5 text-amber-700" />;
    return <span className="text-muted-foreground">#{rank + 1}</span>;
  };

  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case "week":
        return "This Week";
      case "month":
        return "This Month";
      case "all":
        return "All Time";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary mb-4">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Trending & Leaderboards</h1>
            <p className="text-muted-foreground">
              Discover the hottest posts and top creators in the community
            </p>
          </div>

          {/* Time Filter */}
          <div className="flex justify-center mb-8">
            <Select value={timeFilter} onValueChange={(value: any) => setTimeFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="posts">Trending Posts</TabsTrigger>
              <TabsTrigger value="creators">Top Creators</TabsTrigger>
            </TabsList>

            {/* Trending Posts */}
            <TabsContent value="posts">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Most Popular Posts - {getTimeFilterLabel()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <Skeleton className="w-8 h-8" />
                          <Skeleton className="w-20 h-20 rounded-lg" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : trendingPosts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No posts found for this time period
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {trendingPosts.map((post, index) => (
                        <Link
                          key={post.id}
                          to={`/post/${post.id}`}
                          className="flex items-center gap-4 p-4 rounded-lg hover:bg-accent transition-colors group"
                        >
                          <div className="flex items-center justify-center w-8">
                            {getRankBadge(index)}
                          </div>
                          <img
                            src={post.image_url}
                            alt={post.title}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                              {post.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <span>by {post.profiles.username}</span>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <div className="flex items-center gap-1">
                                <Heart className="w-4 h-4 text-red-500" />
                                <span>{post.likes_count}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageSquare className="w-4 h-4 text-blue-500" />
                                <span>{post.comments_count}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4 text-green-500" />
                                <span>{post.views_count}</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Top Creators */}
            <TabsContent value="creators">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Top Creators - {getTimeFilterLabel()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <Skeleton className="w-8 h-8" />
                          <Skeleton className="w-16 h-16 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : topCreators.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No creators found for this time period
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {topCreators.map((creator, index) => (
                        <Link
                          key={creator.id}
                          to={`/profile/${creator.id}`}
                          className="flex items-center gap-4 p-4 rounded-lg hover:bg-accent transition-colors group"
                        >
                          <div className="flex items-center justify-center w-8">
                            {getRankBadge(index)}
                          </div>
                          <Avatar className="w-16 h-16">
                            <AvatarImage src={creator.avatar_url || undefined} />
                            <AvatarFallback>
                              {creator.username.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {creator.username}
                            </h3>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Heart className="w-4 h-4 text-red-500" />
                                <span>{creator.total_likes} likes</span>
                              </div>
                              <div>
                                <Badge variant="secondary">{creator.total_posts} posts</Badge>
                              </div>
                              <div>
                                <span>{creator.followers_count} followers</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Leaderboards;
