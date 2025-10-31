import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserPlus, UserCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";

interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  followerCount: number;
  postCount: number;
  isFollowing: boolean;
}

const Discover = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setCurrentUser(user);
    fetchUsers(user.id);
  };

  const fetchUsers = async (currentUserId: string) => {
    setLoading(true);
    
    // Get all profiles except current user
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", currentUserId);

    if (!profiles) {
      setLoading(false);
      return;
    }

    // Get follower counts, post counts, and follow status for each user
    const enrichedUsers = await Promise.all(
      profiles.map(async (profile) => {
        const { count: followerCount } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", profile.id);

        const { count: postCount } = await supabase
          .from("posts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", profile.id);

        const { data: followData } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", currentUserId)
          .eq("following_id", profile.id)
          .maybeSingle();

        return {
          id: profile.id,
          username: profile.username,
          avatar_url: profile.avatar_url,
          followerCount: followerCount || 0,
          postCount: postCount || 0,
          isFollowing: !!followData,
        };
      })
    );

    setUsers(enrichedUsers);
    setLoading(false);
  };

  const handleFollow = async (userId: string) => {
    if (!currentUser) return;

    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (user.isFollowing) {
      // Unfollow
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUser.id)
        .eq("following_id", userId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to unfollow user",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Unfollowed",
        description: `You unfollowed ${user.username}`,
      });
    } else {
      // Follow
      const { error } = await supabase
        .from("follows")
        .insert({ follower_id: currentUser.id, following_id: userId });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to follow user",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Following",
        description: `You are now following ${user.username}`,
      });
    }

    // Refresh users
    fetchUsers(currentUser.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8 mt-16">
        <h1 className="text-4xl font-bold mb-8">Discover Users</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <Card key={user.id} className="p-6">
              <div className="flex flex-col items-center text-center">
                <Link to={`/profile/${user.id}`} className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-2xl font-bold mb-4 hover:scale-105 transition-transform">
                  {user.username.charAt(0).toUpperCase()}
                </Link>
                
                <Link to={`/profile/${user.id}`} className="hover:text-primary transition-colors">
                  <h3 className="text-xl font-semibold mb-2">{user.username}</h3>
                </Link>
                
                <div className="flex gap-4 text-sm text-muted-foreground mb-4">
                  <span>{user.postCount} posts</span>
                  <span>{user.followerCount} followers</span>
                </div>
                
                <Button
                  onClick={() => handleFollow(user.id)}
                  variant={user.isFollowing ? "outline" : "default"}
                  className="w-full"
                >
                  {user.isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4 mr-2" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No users to discover yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Discover;
