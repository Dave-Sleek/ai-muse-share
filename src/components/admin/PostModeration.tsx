import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Eye, Trash2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Post {
  id: string;
  title: string;
  image_url: string;
  created_at: string;
  user_id: string;
  tags: string[];
  profiles: {
    username: string;
  };
  likes_count: number;
  views_count: number;
}

export const PostModeration = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('posts')
        .select(`
          id, title, image_url, created_at, user_id, tags,
          profiles!posts_user_id_fkey(username)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data: postsData, error } = await query;

      if (error) throw error;

      // Fetch likes and views counts
      const postIds = postsData?.map(p => p.id) || [];
      
      const [{ data: likes }, { data: views }] = await Promise.all([
        supabase.from('likes').select('post_id').in('post_id', postIds),
        supabase.from('post_views').select('post_id').in('post_id', postIds),
      ]);

      const likesMap = likes?.reduce((acc, l) => {
        acc[l.post_id] = (acc[l.post_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const viewsMap = views?.reduce((acc, v) => {
        acc[v.post_id] = (acc[v.post_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const postsWithCounts = postsData?.map(p => ({
        ...p,
        profiles: p.profiles as { username: string },
        likes_count: likesMap[p.id] || 0,
        views_count: viewsMap[p.id] || 0,
      })) || [];

      setPosts(postsWithCounts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to fetch posts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [searchQuery]);

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast.success('Post deleted successfully');
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Post Moderation</CardTitle>
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Post</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Stats</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={post.image_url}
                          alt={post.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div>
                          <p className="font-medium line-clamp-1">{post.title}</p>
                          <div className="flex gap-1 flex-wrap mt-1">
                            {post.tags?.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{post.profiles?.username}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>❤️ {post.likes_count}</span>
                        <span>👁️ {post.views_count}</span>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(post.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/post/${post.id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Post?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the post
                                and all associated data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeletePost(post.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {posts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No posts found
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
