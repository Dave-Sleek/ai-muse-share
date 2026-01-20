import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Image, MessageSquare, Heart, Eye, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Stats {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  totalLikes: number;
  totalViews: number;
  newUsersToday: number;
}

export const AdminStats = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    totalLikes: 0,
    totalViews: 0,
    newUsersToday: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
          { count: usersCount },
          { count: postsCount },
          { count: commentsCount },
          { count: likesCount },
          { count: viewsCount },
          { count: newUsersCount },
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('posts').select('*', { count: 'exact', head: true }),
          supabase.from('comments').select('*', { count: 'exact', head: true }),
          supabase.from('likes').select('*', { count: 'exact', head: true }),
          supabase.from('post_views').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true })
            .gte('created_at', today.toISOString()),
        ]);

        setStats({
          totalUsers: usersCount || 0,
          totalPosts: postsCount || 0,
          totalComments: commentsCount || 0,
          totalLikes: likesCount || 0,
          totalViews: viewsCount || 0,
          newUsersToday: newUsersCount || 0,
        });
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-primary' },
    { title: 'Total Posts', value: stats.totalPosts, icon: Image, color: 'text-secondary' },
    { title: 'Total Comments', value: stats.totalComments, icon: MessageSquare, color: 'text-accent' },
    { title: 'Total Likes', value: stats.totalLikes, icon: Heart, color: 'text-destructive' },
    { title: 'Total Views', value: stats.totalViews, icon: Eye, color: 'text-muted-foreground' },
    { title: 'New Users Today', value: stats.newUsersToday, icon: TrendingUp, color: 'text-green-500' },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.title} className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
