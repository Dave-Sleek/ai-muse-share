import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { Loader2 } from 'lucide-react';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';

interface DailyData {
  date: string;
  count: number;
}

interface EngagementData {
  date: string;
  likes: number;
  comments: number;
  views: number;
}

export const AdminAnalytics = () => {
  const [userGrowth, setUserGrowth] = useState<DailyData[]>([]);
  const [postActivity, setPostActivity] = useState<DailyData[]>([]);
  const [engagement, setEngagement] = useState<EngagementData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const endDate = new Date();
        const startDate = subDays(endDate, 30);
        
        // Generate all dates in the range
        const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
        const dateMap = new Map<string, { users: number; posts: number; likes: number; comments: number; views: number }>();
        
        dateRange.forEach(date => {
          const key = format(date, 'yyyy-MM-dd');
          dateMap.set(key, { users: 0, posts: 0, likes: 0, comments: 0, views: 0 });
        });

        // Fetch user signups
        const { data: users } = await supabase
          .from('profiles')
          .select('created_at')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        users?.forEach(user => {
          const date = format(new Date(user.created_at), 'yyyy-MM-dd');
          const existing = dateMap.get(date);
          if (existing) {
            existing.users += 1;
          }
        });

        // Fetch posts
        const { data: posts } = await supabase
          .from('posts')
          .select('created_at')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        posts?.forEach(post => {
          const date = format(new Date(post.created_at), 'yyyy-MM-dd');
          const existing = dateMap.get(date);
          if (existing) {
            existing.posts += 1;
          }
        });

        // Fetch likes
        const { data: likes } = await supabase
          .from('likes')
          .select('created_at')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        likes?.forEach(like => {
          const date = format(new Date(like.created_at), 'yyyy-MM-dd');
          const existing = dateMap.get(date);
          if (existing) {
            existing.likes += 1;
          }
        });

        // Fetch comments
        const { data: comments } = await supabase
          .from('comments')
          .select('created_at')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        comments?.forEach(comment => {
          const date = format(new Date(comment.created_at), 'yyyy-MM-dd');
          const existing = dateMap.get(date);
          if (existing) {
            existing.comments += 1;
          }
        });

        // Fetch views
        const { data: views } = await supabase
          .from('post_views')
          .select('viewed_at')
          .gte('viewed_at', startDate.toISOString())
          .lte('viewed_at', endDate.toISOString());

        views?.forEach(view => {
          const date = format(new Date(view.viewed_at), 'yyyy-MM-dd');
          const existing = dateMap.get(date);
          if (existing) {
            existing.views += 1;
          }
        });

        // Transform data for charts
        const userGrowthData: DailyData[] = [];
        const postActivityData: DailyData[] = [];
        const engagementData: EngagementData[] = [];

        dateRange.forEach(date => {
          const key = format(date, 'yyyy-MM-dd');
          const displayDate = format(date, 'MMM dd');
          const data = dateMap.get(key)!;

          userGrowthData.push({ date: displayDate, count: data.users });
          postActivityData.push({ date: displayDate, count: data.posts });
          engagementData.push({
            date: displayDate,
            likes: data.likes,
            comments: data.comments,
            views: data.views,
          });
        });

        setUserGrowth(userGrowthData);
        setPostActivity(postActivityData);
        setEngagement(engagementData);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">User Growth</TabsTrigger>
          <TabsTrigger value="posts">Post Activity</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
              <CardDescription>New user signups over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={userGrowth}>
                    <defs>
                      <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="New Users"
                      stroke="hsl(var(--primary))"
                      fill="url(#userGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="posts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Post Activity</CardTitle>
              <CardDescription>Posts created over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={postActivity}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Bar
                      dataKey="count"
                      name="Posts"
                      fill="hsl(var(--secondary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Trends</CardTitle>
              <CardDescription>Likes, comments, and views over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={engagement}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="likes"
                      name="Likes"
                      stroke="hsl(var(--destructive))"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="comments"
                      name="Comments"
                      stroke="hsl(var(--accent))"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="views"
                      name="Views"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
