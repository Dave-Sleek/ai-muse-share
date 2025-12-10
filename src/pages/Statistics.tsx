import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import GoalSetting from "@/components/GoalSetting";
import StreakTracker from "@/components/StreakTracker";
import { Achievements } from "@/components/Achievements";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart3, 
  TrendingUp, 
  Heart, 
  Eye, 
  MessageSquare, 
  Users, 
  Image as ImageIcon,
  Bookmark,
  Calendar,
  Clock,
  Flame,
  Award
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";

interface DailyStats {
  date: string;
  likes: number;
  views: number;
  comments: number;
}

interface PostPerformance {
  id: string;
  title: string;
  image_url: string;
  likes: number;
  views: number;
  comments: number;
  engagement_rate: number;
  created_at: string;
}

interface OverviewStats {
  totalPosts: number;
  totalLikes: number;
  totalViews: number;
  totalComments: number;
  totalFollowers: number;
  totalFollowing: number;
  totalBookmarks: number;
  avgEngagement: number;
}

const CHART_COLORS = [
  "hsl(266, 100%, 65%)",
  "hsl(190, 100%, 50%)",
  "hsl(320, 100%, 60%)",
  "hsl(45, 100%, 50%)",
  "hsl(150, 80%, 45%)"
];

const Statistics: React.FC = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<"7" | "30" | "90">("30");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [overviewStats, setOverviewStats] = useState<OverviewStats>({
    totalPosts: 0,
    totalLikes: 0,
    totalViews: 0,
    totalComments: 0,
    totalFollowers: 0,
    totalFollowing: 0,
    totalBookmarks: 0,
    avgEngagement: 0
  });
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [topPosts, setTopPosts] = useState<PostPerformance[]>([]);
  const [engagementByHour, setEngagementByHour] = useState<{ hour: string; count: number }[]>([]);
  const [contentDistribution, setContentDistribution] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchAllStats();
    }
  }, [userId, timeRange]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate("/auth");
      return;
    }
    setUserId(session.user.id);
  };

  const fetchAllStats = async () => {
    if (!userId) return;
    setLoading(true);

    const days = parseInt(timeRange);
    const startDate = subDays(new Date(), days).toISOString();

    await Promise.all([
      fetchOverviewStats(startDate),
      fetchDailyStats(days),
      fetchTopPosts(startDate),
      fetchEngagementByHour(startDate),
      fetchContentDistribution(),
      fetchStreak()
    ]);

    setLoading(false);
  };

  const fetchStreak = async () => {
    const { data } = await supabase
      .from("user_streaks")
      .select("current_streak")
      .eq("user_id", userId)
      .eq("streak_type", "posts")
      .maybeSingle();
    
    setCurrentStreak(data?.current_streak || 0);
  };

  const fetchOverviewStats = async (startDate: string) => {
    // Get user's posts
    const { data: posts } = await supabase
      .from("posts")
      .select("id")
      .eq("user_id", userId);

    const postIds = posts?.map(p => p.id) || [];

    // Parallel fetches for counts
    const [
      { count: totalLikes },
      { count: totalViews },
      { count: totalComments },
      { count: totalFollowers },
      { count: totalFollowing },
      { count: totalBookmarks }
    ] = await Promise.all([
      supabase.from("likes").select("*", { count: "exact", head: true })
        .in("post_id", postIds.length > 0 ? postIds : ["none"]),
      supabase.from("post_views").select("*", { count: "exact", head: true })
        .in("post_id", postIds.length > 0 ? postIds : ["none"]),
      supabase.from("comments").select("*", { count: "exact", head: true })
        .in("post_id", postIds.length > 0 ? postIds : ["none"]),
      supabase.from("follows").select("*", { count: "exact", head: true })
        .eq("following_id", userId),
      supabase.from("follows").select("*", { count: "exact", head: true })
        .eq("follower_id", userId),
      supabase.from("bookmarks").select("*", { count: "exact", head: true })
        .in("post_id", postIds.length > 0 ? postIds : ["none"])
    ]);

    const views = totalViews || 1;
    const avgEngagement = views > 0 
      ? (((totalLikes || 0) + (totalComments || 0)) / views * 100)
      : 0;

    setOverviewStats({
      totalPosts: postIds.length,
      totalLikes: totalLikes || 0,
      totalViews: totalViews || 0,
      totalComments: totalComments || 0,
      totalFollowers: totalFollowers || 0,
      totalFollowing: totalFollowing || 0,
      totalBookmarks: totalBookmarks || 0,
      avgEngagement: Math.round(avgEngagement * 10) / 10
    });
  };

  const fetchDailyStats = async (days: number) => {
    const { data: posts } = await supabase
      .from("posts")
      .select("id")
      .eq("user_id", userId);

    const postIds = posts?.map(p => p.id) || [];
    if (postIds.length === 0) {
      setDailyStats([]);
      return;
    }

    const dateRange = eachDayOfInterval({
      start: subDays(new Date(), days),
      end: new Date()
    });

    // Fetch all engagement data
    const [{ data: likes }, { data: views }, { data: comments }] = await Promise.all([
      supabase.from("likes").select("created_at").in("post_id", postIds),
      supabase.from("post_views").select("viewed_at").in("post_id", postIds),
      supabase.from("comments").select("created_at").in("post_id", postIds)
    ]);

    const dailyData = dateRange.map(date => {
      const dateStr = format(date, "yyyy-MM-dd");
      const dayStart = startOfDay(date);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const dayLikes = likes?.filter(l => {
        const d = new Date(l.created_at);
        return d >= dayStart && d < dayEnd;
      }).length || 0;

      const dayViews = views?.filter(v => {
        const d = new Date(v.viewed_at);
        return d >= dayStart && d < dayEnd;
      }).length || 0;

      const dayComments = comments?.filter(c => {
        const d = new Date(c.created_at);
        return d >= dayStart && d < dayEnd;
      }).length || 0;

      return {
        date: format(date, "MMM d"),
        likes: dayLikes,
        views: dayViews,
        comments: dayComments
      };
    });

    setDailyStats(dailyData);
  };

  const fetchTopPosts = async (startDate: string) => {
    const { data: posts } = await supabase
      .from("posts")
      .select("id, title, image_url, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!posts || posts.length === 0) {
      setTopPosts([]);
      return;
    }

    const postsWithStats = await Promise.all(
      posts.map(async (post) => {
        const [{ count: likes }, { count: views }, { count: comments }] = await Promise.all([
          supabase.from("likes").select("*", { count: "exact", head: true }).eq("post_id", post.id),
          supabase.from("post_views").select("*", { count: "exact", head: true }).eq("post_id", post.id),
          supabase.from("comments").select("*", { count: "exact", head: true }).eq("post_id", post.id)
        ]);

        const v = views || 1;
        const engagement_rate = v > 0 
          ? ((likes || 0) + (comments || 0)) / v * 100
          : 0;

        return {
          ...post,
          likes: likes || 0,
          views: views || 0,
          comments: comments || 0,
          engagement_rate: Math.round(engagement_rate * 10) / 10
        };
      })
    );

    const sorted = postsWithStats.sort((a, b) => 
      (b.likes * 3 + b.comments * 2 + b.views) - (a.likes * 3 + a.comments * 2 + a.views)
    );

    setTopPosts(sorted.slice(0, 5));
  };

  const fetchEngagementByHour = async (startDate: string) => {
    const { data: posts } = await supabase
      .from("posts")
      .select("id")
      .eq("user_id", userId);

    const postIds = posts?.map(p => p.id) || [];
    if (postIds.length === 0) {
      setEngagementByHour([]);
      return;
    }

    const { data: likes } = await supabase
      .from("likes")
      .select("created_at")
      .in("post_id", postIds)
      .gte("created_at", startDate);

    const hourCounts: Record<number, number> = {};
    for (let i = 0; i < 24; i++) hourCounts[i] = 0;

    likes?.forEach(like => {
      const hour = new Date(like.created_at).getHours();
      hourCounts[hour]++;
    });

    const hourData = Object.entries(hourCounts).map(([hour, count]) => ({
      hour: `${hour}:00`,
      count
    }));

    setEngagementByHour(hourData);
  };

  const fetchContentDistribution = async () => {
    const { data: posts } = await supabase
      .from("posts")
      .select("tags")
      .eq("user_id", userId);

    if (!posts || posts.length === 0) {
      setContentDistribution([]);
      return;
    }

    const tagCounts: Record<string, number> = {};
    posts.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    const distribution = Object.entries(tagCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    setContentDistribution(distribution.length > 0 ? distribution : [{ name: "No tags", value: posts.length }]);
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    color = "primary" 
  }: { 
    title: string; 
    value: string | number; 
    icon: React.ElementType; 
    trend?: string;
    color?: string;
  }) => (
    <Card className="hover-lift">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {trend && (
              <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {trend}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-xl bg-${color}/10`}>
            <Icon className={`w-6 h-6 text-${color}`} style={{ color: `hsl(var(--${color}))` }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading && !userId) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-secondary">
                  <BarChart3 className="w-6 h-6 text-primary-foreground" />
                </div>
                <h1 className="text-3xl font-bold gradient-text">Your Statistics</h1>
              </div>
              <p className="text-muted-foreground">
                Track your performance and engagement over time
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Select value={timeRange} onValueChange={(v: "7" | "30" | "90") => setTimeRange(v)}>
                <SelectTrigger className="w-40">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                <StatCard title="Total Likes" value={overviewStats.totalLikes} icon={Heart} color="primary" />
                <StatCard title="Total Views" value={overviewStats.totalViews} icon={Eye} color="secondary" />
                <StatCard title="Comments" value={overviewStats.totalComments} icon={MessageSquare} color="accent" />
                <StatCard title="Followers" value={overviewStats.totalFollowers} icon={Users} color="primary" />
              </>
            )}
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                <StatCard title="Posts" value={overviewStats.totalPosts} icon={ImageIcon} color="secondary" />
                <StatCard title="Following" value={overviewStats.totalFollowing} icon={Users} color="accent" />
                <StatCard title="Bookmarks" value={overviewStats.totalBookmarks} icon={Bookmark} color="primary" />
                <StatCard title="Engagement Rate" value={`${overviewStats.avgEngagement}%`} icon={Flame} color="accent" />
              </>
            )}
          </div>

          {/* Achievements Section */}
          {userId && (
            <div className="mb-8">
              <Achievements
                userId={userId}
                userStats={{
                  posts: overviewStats.totalPosts,
                  likes_received: overviewStats.totalLikes,
                  comments_received: overviewStats.totalComments,
                  followers: overviewStats.totalFollowers,
                  streak: currentStreak
                }}
              />
            </div>
          )}

          {/* Goals & Streak Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <GoalSetting 
                userId={userId!} 
                currentStats={{
                  followers: overviewStats.totalFollowers,
                  likes: overviewStats.totalLikes,
                  posts: overviewStats.totalPosts
                }}
              />
            </div>
            <div>
              <StreakTracker userId={userId!} />
            </div>
          </div>

          {/* Charts Section */}
          <Tabs defaultValue="engagement" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex">
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="performance">Top Posts</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            {/* Engagement Tab */}
            <TabsContent value="engagement" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Engagement Over Time
                  </CardTitle>
                  <CardDescription>Likes, views, and comments trends</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-80 w-full" />
                  ) : dailyStats.length === 0 ? (
                    <div className="h-80 flex items-center justify-center text-muted-foreground">
                      No engagement data yet
                    </div>
                  ) : (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dailyStats}>
                          <defs>
                            <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS[1]} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={CHART_COLORS[1]} stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS[2]} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={CHART_COLORS[2]} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="date" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: "hsl(var(--card))", 
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px"
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="views" 
                            stroke={CHART_COLORS[1]} 
                            fill="url(#colorViews)" 
                            name="Views"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="likes" 
                            stroke={CHART_COLORS[0]} 
                            fill="url(#colorLikes)" 
                            name="Likes"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="comments" 
                            stroke={CHART_COLORS[2]} 
                            fill="url(#colorComments)" 
                            name="Comments"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Peak Hours Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Peak Engagement Hours
                    </CardTitle>
                    <CardDescription>When your audience is most active</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <Skeleton className="h-64 w-full" />
                    ) : engagementByHour.length === 0 ? (
                      <div className="h-64 flex items-center justify-center text-muted-foreground">
                        No data available
                      </div>
                    ) : (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={engagementByHour}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="hour" className="text-xs" interval={3} />
                            <YAxis className="text-xs" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: "hsl(var(--card))", 
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px"
                              }}
                            />
                            <Bar dataKey="count" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} name="Likes" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Content Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5" />
                      Content Categories
                    </CardTitle>
                    <CardDescription>Distribution by tags</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <Skeleton className="h-64 w-full" />
                    ) : contentDistribution.length === 0 ? (
                      <div className="h-64 flex items-center justify-center text-muted-foreground">
                        No categories yet
                      </div>
                    ) : (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={contentDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={90}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {contentDistribution.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: "hsl(var(--card))", 
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px"
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap justify-center gap-3 mt-2">
                          {contentDistribution.map((item, index) => (
                            <div key={item.name} className="flex items-center gap-1.5 text-sm">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                              />
                              <span className="text-muted-foreground">{item.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Top Performing Posts
                  </CardTitle>
                  <CardDescription>Your best content by engagement</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <Skeleton className="w-20 h-20 rounded-lg" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : topPosts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No posts yet. Start creating to see your stats!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {topPosts.map((post, index) => (
                        <div
                          key={post.id}
                          className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                            {index + 1}
                          </div>
                          <img
                            src={post.image_url}
                            alt={post.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{post.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(post.created_at), "MMM d, yyyy")}
                            </p>
                          </div>
                          <div className="hidden md:flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-1.5">
                              <Heart className="w-4 h-4 text-red-500" />
                              <span>{post.likes}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Eye className="w-4 h-4 text-blue-500" />
                              <span>{post.views}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MessageSquare className="w-4 h-4 text-green-500" />
                              <span>{post.comments}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Flame className="w-4 h-4 text-orange-500" />
                              <span>{post.engagement_rate}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Flame className="w-5 h-5" />
                      Quick Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
                      <span className="text-muted-foreground">Avg. likes per post</span>
                      <span className="font-bold text-lg">
                        {overviewStats.totalPosts > 0 
                          ? Math.round(overviewStats.totalLikes / overviewStats.totalPosts) 
                          : 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
                      <span className="text-muted-foreground">Avg. views per post</span>
                      <span className="font-bold text-lg">
                        {overviewStats.totalPosts > 0 
                          ? Math.round(overviewStats.totalViews / overviewStats.totalPosts) 
                          : 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
                      <span className="text-muted-foreground">Avg. comments per post</span>
                      <span className="font-bold text-lg">
                        {overviewStats.totalPosts > 0 
                          ? Math.round(overviewStats.totalComments / overviewStats.totalPosts * 10) / 10 
                          : 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
                      <span className="text-muted-foreground">Followers to following ratio</span>
                      <span className="font-bold text-lg">
                        {overviewStats.totalFollowing > 0 
                          ? (overviewStats.totalFollowers / overviewStats.totalFollowing).toFixed(2) 
                          : overviewStats.totalFollowers}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Growth Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {overviewStats.totalPosts === 0 ? (
                      <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                        <p className="text-sm">
                          <strong>Get started!</strong> Create your first post to begin tracking your statistics.
                        </p>
                      </div>
                    ) : (
                      <>
                        {overviewStats.avgEngagement < 5 && (
                          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                            <p className="text-sm">
                              <strong>Boost engagement:</strong> Try using more descriptive prompts and engaging titles to increase interaction.
                            </p>
                          </div>
                        )}
                        {engagementByHour.length > 0 && (
                          <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                            <p className="text-sm">
                              <strong>Best posting time:</strong> Your audience is most active during peak hours. Check the engagement chart!
                            </p>
                          </div>
                        )}
                        {overviewStats.totalFollowers < 10 && (
                          <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                            <p className="text-sm">
                              <strong>Grow your audience:</strong> Engage with other creators and participate in challenges to gain followers.
                            </p>
                          </div>
                        )}
                        <div className="p-4 rounded-lg bg-muted">
                          <p className="text-sm text-muted-foreground">
                            Keep creating consistently to see more accurate trends and insights over time.
                          </p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Statistics;