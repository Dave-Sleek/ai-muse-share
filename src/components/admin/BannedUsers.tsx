import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Ban, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BannedUser {
  id: string;
  user_id: string;
  reason: string | null;
  banned_at: string;
  expires_at: string | null;
  is_active: boolean;
  profile?: {
    username: string;
    avatar_url: string | null;
  };
}

export const BannedUsers = () => {
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBannedUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('banned_users' as any)
        .select('*')
        .eq('is_active', true)
        .order('banned_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for banned users
      const userIds = (data as any[])?.map(b => b.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      const profileMap = profiles?.reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {} as Record<string, { username: string; avatar_url: string | null }>) || {};

      const bannedWithProfiles = (data as any[])?.map(b => ({
        ...b,
        profile: profileMap[b.user_id],
      })) || [];

      setBannedUsers(bannedWithProfiles);
    } catch (error) {
      console.error('Error fetching banned users:', error);
      toast.error('Failed to fetch banned users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBannedUsers();
  }, []);

  const handleUnban = async (banId: string, username: string) => {
    try {
      const { error } = await supabase
        .from('banned_users' as any)
        .update({ is_active: false } as any)
        .eq('id', banId);

      if (error) throw error;

      toast.success(`${username} has been unbanned`);
      fetchBannedUsers();
    } catch (error) {
      console.error('Error unbanning user:', error);
      toast.error('Failed to unban user');
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString();

  const getBanType = (expiresAt: string | null) => {
    if (!expiresAt) {
      return <Badge variant="destructive">Permanent</Badge>;
    }
    const isExpired = new Date(expiresAt) < new Date();
    if (isExpired) {
      return <Badge variant="secondary">Expired</Badge>;
    }
    return <Badge variant="secondary">Suspended until {formatDate(expiresAt)}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ban className="h-5 w-5 text-destructive" />
          Banned Users ({bannedUsers.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : bannedUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No banned users
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Banned On</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bannedUsers.map((ban) => (
                  <TableRow key={ban.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={ban.profile?.avatar_url || ''} />
                          <AvatarFallback>
                            {ban.profile?.username?.charAt(0).toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{ban.profile?.username || 'Unknown'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {ban.reason || 'No reason provided'}
                    </TableCell>
                    <TableCell>{getBanType(ban.expires_at)}</TableCell>
                    <TableCell>{formatDate(ban.banned_at)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnban(ban.id, ban.profile?.username || 'User')}
                        className="gap-1"
                      >
                        <UserCheck className="h-4 w-4" />
                        Unban
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
