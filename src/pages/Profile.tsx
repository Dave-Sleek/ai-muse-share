import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { User, LogOut, Heart, MessageCircle, Eye, UserPlus, UserMinus, MapPin, Edit2, Globe, Twitter, Linkedin, Instagram } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProfileEditForm } from "@/components/ProfileEditForm";

interface UserProfile {
  username: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  social_links: any;
}

interface Post {
  id: string;
  title: string;
  prompt: string;
  image_url: string;
  created_at: string;
  likes: { id: string }[];
  comments: { id: string }[];
  post_views: { id: string }[];
}

const Profile = () => {
  const { userId } = useParams();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const profileUserId = userId || currentUser?.id;
  const isOwnProfile = !userId || userId === currentUser?.id;

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user || null);
      
      const targetUserId = userId || session?.user?.id;
      if (targetUserId) {
        fetchProfile(targetUserId);
        fetchPosts(targetUserId);
        fetchFollowCounts(targetUserId);
        if (session?.user && userId && userId !== session.user.id) {
          checkFollowStatus(session.user.id, userId);
        }
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
      const targetUserId = userId || session?.user?.id;
      if (targetUserId) {
        fetchProfile(targetUserId);
        fetchPosts(targetUserId);
        fetchFollowCounts(targetUserId);
        if (session?.user && userId && userId !== session.user.id) {
          checkFollowStatus(session.user.id, userId);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, userId]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username, avatar_url, bio, location, social_links")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchPosts = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          likes(id),
          comments(id),
          post_views(id)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowCounts = async (userId: string) => {
    try {
      const { count: followers } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId);

      const { count: following } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId);

      setFollowerCount(followers || 0);
      setFollowingCount(following || 0);
    } catch (error) {
      console.error("Error fetching follow counts:", error);
    }
  };

  const checkFollowStatus = async (currentUserId: string, targetUserId: string) => {
    try {
      const { data } = await supabase
        .from("follows")
        .select("*")
        .eq("follower_id", currentUserId)
        .eq("following_id", targetUserId)
        .single();
      
      setIsFollowing(!!data);
    } catch (error) {
      setIsFollowing(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || !profileUserId) {
      navigate("/auth");
      return;
    }

    try {
      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUser.id)
          .eq("following_id", profileUserId);
        
        toast({
          title: "Unfollowed",
          description: `You unfollowed ${profile?.username}`,
        });
      } else {
        await supabase
          .from("follows")
          .insert({ follower_id: currentUser.id, following_id: profileUserId });
        
        toast({
          title: "Following",
          description: `You are now following ${profile?.username}`,
        });
      }
      
      setIsFollowing(!isFollowing);
      fetchFollowCounts(profileUserId);
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully",
    });
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('delete-account');
      if (error) throw error;

      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete account. Please contact support.",
        variant: "destructive",
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
          {/* Profile Header */}
          <div className="glass-effect rounded-2xl p-8 mb-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-3xl font-bold mb-2">{profile?.username}</h1>
                
                {profile?.bio && (
                  <p className="text-muted-foreground mb-3 max-w-2xl">{profile.bio}</p>
                )}
                
                {profile?.location && (
                  <div className="flex items-center gap-2 text-muted-foreground mb-3 justify-center sm:justify-start">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.location}</span>
                  </div>
                )}

                {profile?.social_links && Object.keys(profile.social_links).length > 0 && (
                  <div className="flex items-center gap-3 mb-4 justify-center sm:justify-start">
                    {profile.social_links.twitter && (
                      <a href={profile.social_links.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <Twitter className="w-5 h-5" />
                      </a>
                    )}
                    {profile.social_links.instagram && (
                      <a href={profile.social_links.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <Instagram className="w-5 h-5" />
                      </a>
                    )}
                    {profile.social_links.linkedin && (
                      <a href={profile.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                    {profile.social_links.website && (
                      <a href={profile.social_links.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <Globe className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                )}

                <div className="flex gap-6 justify-center sm:justify-start">
                  <div>
                    <span className="text-2xl font-bold gradient-text">{posts.length}</span>
                    <p className="text-sm text-muted-foreground">Posts</p>
                  </div>
                  <div>
                    <span className="text-2xl font-bold gradient-text">
                      {posts.reduce((sum, post) => sum + post.likes.length, 0)}
                    </span>
                    <p className="text-sm text-muted-foreground">Likes</p>
                  </div>
                  <div>
                    <span className="text-2xl font-bold gradient-text">
                      {posts.reduce((sum, post) => sum + post.post_views.length, 0)}
                    </span>
                    <p className="text-sm text-muted-foreground">Views</p>
                  </div>
                  <div>
                    <span className="text-2xl font-bold gradient-text">{followerCount}</span>
                    <p className="text-sm text-muted-foreground">Followers</p>
                  </div>
                  <div>
                    <span className="text-2xl font-bold gradient-text">{followingCount}</span>
                    <p className="text-sm text-muted-foreground">Following</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {isOwnProfile ? (
                  <>
                    <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit Profile
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Edit Profile</DialogTitle>
                        </DialogHeader>
                        {profile && (
                          <ProfileEditForm
                            currentProfile={profile}
                            userId={currentUser.id}
                            onSuccess={() => {
                              setEditDialogOpen(false);
                              fetchProfile(currentUser.id);
                            }}
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                    
                    <Button variant="outline" onClick={handleSignOut}>
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </Button>
                    <Button variant="destructive" onClick={handleDeleteAccount}>
                      Delete Account
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant={isFollowing ? "outline" : "hero"}
                    onClick={handleFollow}
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus className="w-4 h-4 mr-2" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Follow
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Posts Grid */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {isOwnProfile ? "Your Posts" : `${profile?.username}'s Posts`}
            </h2>
            {isOwnProfile && (
              <Link to="/create">
                <Button variant="hero">Create New Post</Button>
              </Link>
            )}
          </div>

          {posts.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, index) => (
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

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Heart className="w-4 h-4" />
                        <span className="text-sm">{post.likes.length}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm">{post.comments.length}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Eye className="w-4 h-4" />
                        <span className="text-sm">{post.post_views.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-effect rounded-2xl p-12 text-center">
              <p className="text-xl text-muted-foreground mb-6">
                {isOwnProfile 
                  ? "You haven't created any posts yet" 
                  : `${profile?.username} hasn't created any posts yet`}
              </p>
              {isOwnProfile && (
                <Link to="/create">
                  <Button variant="hero" size="lg">
                    Create Your First Post
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
