import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserPlus, UserCheck, Users, ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";

interface SuggestedUser {
  id: string;
  username: string;
  avatar_url: string | null;
  followerCount: number;
  postCount: number;
  isFollowing: boolean;
}

const SuggestedUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
    await fetchSuggestedUsers(user?.id || null);
  };

  const fetchSuggestedUsers = async (currentUserId: string | null) => {
    setLoading(true);

    // Get top creators by follower count (limit to 6)
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", currentUserId || "")
      .limit(20);

    if (!profiles || profiles.length === 0) {
      setLoading(false);
      return;
    }

    // Enrich with follower counts and follow status
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

        let isFollowing = false;
        if (currentUserId) {
          const { data: followData } = await supabase
            .from("follows")
            .select("id")
            .eq("follower_id", currentUserId)
            .eq("following_id", profile.id)
            .maybeSingle();
          isFollowing = !!followData;
        }

        return {
          id: profile.id,
          username: profile.username,
          avatar_url: profile.avatar_url,
          followerCount: followerCount || 0,
          postCount: postCount || 0,
          isFollowing,
        };
      })
    );

    // Sort by follower count and take top 6
    const topUsers = enrichedUsers
      .sort((a, b) => b.followerCount - a.followerCount)
      .slice(0, 6);

    setUsers(topUsers);
    setLoading(false);
  };

  const handleFollow = async (userId: string) => {
    if (!currentUser) {
      navigate("/auth");
      return;
    }

    const user = users.find((u) => u.id === userId);
    if (!user) return;

    if (user.isFollowing) {
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

    fetchSuggestedUsers(currentUser.id);
  };

  if (loading) {
    return (
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  if (users.length === 0) {
    return null;
  }

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <h2 className="text-3xl font-bold">Suggested Creators</h2>
              <p className="text-muted-foreground">
                Popular creators you might want to follow
              </p>
            </div>
          </div>
          <Link to="/discover">
            <Button variant="outline" className="gap-2">
              View All
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {users.map((user) => (
            <Card
              key={user.id}
              className="p-4 hover:shadow-lg transition-all duration-300 group"
            >
              <div className="flex flex-col items-center text-center">
                <Link
                  to={`/profile/${user.id}`}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xl font-bold mb-3 group-hover:scale-110 transition-transform"
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    user.username.charAt(0).toUpperCase()
                  )}
                </Link>

                <Link
                  to={`/profile/${user.id}`}
                  className="hover:text-primary transition-colors"
                >
                  <h3 className="font-semibold truncate max-w-full">
                    {user.username}
                  </h3>
                </Link>

                <div className="flex gap-2 text-xs text-muted-foreground my-2">
                  <span>{user.postCount} posts</span>
                  <span>•</span>
                  <span>{user.followerCount} followers</span>
                </div>

                <Button
                  onClick={() => handleFollow(user.id)}
                  variant={user.isFollowing ? "outline" : "default"}
                  size="sm"
                  className="w-full"
                >
                  {user.isFollowing ? (
                    <>
                      <UserCheck className="w-3 h-3 mr-1" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3 h-3 mr-1" />
                      Follow
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SuggestedUsers;
