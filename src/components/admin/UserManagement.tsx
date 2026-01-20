import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Shield, ShieldCheck, User, MoreHorizontal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
  role?: string;
  posts_count?: number;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('id, username, avatar_url, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (searchQuery) {
        query = query.ilike('username', `%${searchQuery}%`);
      }

      const { data: profiles, error } = await query;

      if (error) throw error;

      // Fetch roles for each user
      const userIds = profiles?.map(p => p.id) || [];
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      // Fetch post counts
      const { data: postCounts } = await supabase
        .from('posts')
        .select('user_id')
        .in('user_id', userIds);

      const postCountMap = postCounts?.reduce((acc, post) => {
        acc[post.user_id] = (acc[post.user_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const roleMap = roles?.reduce((acc, r) => {
        acc[r.user_id] = r.role;
        return acc;
      }, {} as Record<string, string>) || {};

      const usersWithRoles = profiles?.map(p => ({
        ...p,
        role: roleMap[p.id] || 'user',
        posts_count: postCountMap[p.id] || 0,
      })) || [];

      // Filter by role if needed
      const filteredUsers = roleFilter === 'all' 
        ? usersWithRoles 
        : usersWithRoles.filter(u => u.role === roleFilter);

      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, roleFilter]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      // Remove existing role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Add new role if not 'user'
      if (newRole !== 'user') {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole as 'admin' | 'moderator' });

        if (error) throw error;
      }

      toast.success(`User role updated to ${newRole}`);
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-destructive"><ShieldCheck className="w-3 h-3 mr-1" />Admin</Badge>;
      case 'moderator':
        return <Badge className="bg-primary"><Shield className="w-3 h-3 mr-1" />Moderator</Badge>;
      default:
        return <Badge variant="secondary"><User className="w-3 h-3 mr-1" />User</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
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
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Posts</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || ''} />
                          <AvatarFallback>{user.username?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.username}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role || 'user')}</TableCell>
                    <TableCell>{user.posts_count}</TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'admin')}>
                            Make Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'moderator')}>
                            Make Moderator
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'user')}>
                            Remove Role
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {users.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No users found
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
