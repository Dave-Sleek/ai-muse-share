import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { User, LogOut, Heart, MessageCircle, Eye, UserPlus, UserMinus, MapPin, Edit2, Globe, Twitter, Linkedin, Instagram, KeyRound, Share2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProfileEditForm } from "@/components/ProfileEditForm";
import { PasswordChangeForm } from "@/components/PasswordChangeForm";
import BookmarkButton from "@/components/BookmarkButton";

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
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
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

  const handleShareProfile = async () => {
    const profileUrl = `${window.location.origin}/profile/${profileUserId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.username}'s Profile`,
          text: `Check out ${profile?.username}'s AI art on PromptShare!`,
          url: profileUrl,
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      try {
        await navigator.clipboard.writeText(profileUrl);
        toast({
          title: "Link copied!",
          description: "Profile link copied to clipboard",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to copy link",
          variant: "destructive",
        });
      }
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
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header Card */}
          <div className="glass-effect rounded-3xl p-8 sm:p-10 mb-8 border border-border/40 animate-fade-in">
            {/* Avatar and Actions Row */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-32 h-32 bg-gradient-to-br from-primary via-secondary to-accent rounded-full flex items-center justify-center ring-4 ring-background shadow-xl">
                  <User className="w-16 h-16 text-white" />
                </div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 blur-xl opacity-50 group-hover:opacity-75 transition-opacity -z-10" />
              </div>

              {/* Username and Actions */}
              <div className="flex-1 text-center sm:text-left min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                  <h1 className="text-4xl font-bold gradient-text">{profile?.username}</h1>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 justify-center sm:justify-start flex-wrap">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleShareProfile}
                      className="gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </Button>
                    
                    {isOwnProfile ? (
                      <>
                        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                              <Edit2 className="w-4 h-4" />
                              Edit
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
                        
                        <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                              <KeyRound className="w-4 h-4" />
                              Password
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Change Password</DialogTitle>
                            </DialogHeader>
                            <PasswordChangeForm onSuccess={() => setPasswordDialogOpen(false)} />
                          </DialogContent>
                        </Dialog>
                        
                        <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-2">
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleDeleteAccount}>
                          Delete
                        </Button>
                      </>
                    ) : (
                      <Button 
                        variant={isFollowing ? "outline" : "default"}
                        size="sm"
                        onClick={handleFollow}
                        className="gap-2"
                      >
                        {isFollowing ? (
                          <>
                            <UserMinus className="w-4 h-4" />
                            Unfollow
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4" />
                            Follow
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {profile?.bio && (
                  <p className="text-muted-foreground text-lg mb-4 leading-relaxed max-w-2xl">
                    {profile.bio}
                  </p>
                )}

                {/* Location and Social Links */}
                <div className="flex flex-wrap items-center gap-4 mb-6 justify-center sm:justify-start">
                  {profile?.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{profile.location}</span>
                    </div>
                  )}

                  {profile?.social_links && Object.keys(profile.social_links).length > 0 && (
                    <div className="flex items-center gap-2 pl-4 border-l border-border">
                      {profile.social_links.twitter && (
                        <a 
                          href={profile.social_links.twitter} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="w-9 h-9 rounded-full bg-muted hover:bg-primary/10 flex items-center justify-center transition-all hover:scale-110"
                          title="Twitter/X"
                        >
                          <Twitter className="w-4 h-4 text-muted-foreground hover:text-primary" />
                        </a>
                      )}
                      {profile.social_links.instagram && (
                        <a 
                          href={profile.social_links.instagram} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="w-9 h-9 rounded-full bg-muted hover:bg-primary/10 flex items-center justify-center transition-all hover:scale-110"
                          title="Instagram"
                        >
                          <Instagram className="w-4 h-4 text-muted-foreground hover:text-primary" />
                        </a>
                      )}
                      {profile.social_links.linkedin && (
                        <a 
                          href={profile.social_links.linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="w-9 h-9 rounded-full bg-muted hover:bg-primary/10 flex items-center justify-center transition-all hover:scale-110"
                          title="LinkedIn"
                        >
                          <Linkedin className="w-4 h-4 text-muted-foreground hover:text-primary" />
                        </a>
                      )}
                      {profile.social_links.website && (
                        <a 
                          href={profile.social_links.website} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="w-9 h-9 rounded-full bg-muted hover:bg-primary/10 flex items-center justify-center transition-all hover:scale-110"
                          title="Website"
                        >
                          <Globe className="w-4 h-4 text-muted-foreground hover:text-primary" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 sm:gap-6">
                  <div className="glass-effect rounded-xl p-4 text-center hover-lift">
                    <div className="text-3xl font-bold gradient-text mb-1">{posts.length}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Posts</div>
                  </div>
                  <div className="glass-effect rounded-xl p-4 text-center hover-lift">
                    <div className="text-3xl font-bold gradient-text mb-1">
                      {posts.reduce((sum, post) => sum + post.likes.length, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Likes</div>
                  </div>
                  <div className="glass-effect rounded-xl p-4 text-center hover-lift">
                    <div className="text-3xl font-bold gradient-text mb-1">
                      {posts.reduce((sum, post) => sum + post.post_views.length, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Views</div>
                  </div>
                  <div className="glass-effect rounded-xl p-4 text-center hover-lift">
                    <div className="text-3xl font-bold gradient-text mb-1">{followerCount}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Followers</div>
                  </div>
                  <div className="glass-effect rounded-xl p-4 text-center hover-lift">
                    <div className="text-3xl font-bold gradient-text mb-1">{followingCount}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Following</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Posts Section Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {isOwnProfile ? "Your Posts" : `${profile?.username}'s Posts`}
            </h2>
            {isOwnProfile && (
              <Link to="/create">
                <Button variant="default" className="gap-2">
                  Create New Post
                </Button>
              </Link>
            )}
          </div>

          {posts.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, index) => (
                <Link 
                  key={post.id}
                  to={`/post/${post.id}`}
                  className="group"
                >
                  <div
                    className="glass-effect rounded-2xl overflow-hidden hover-lift border border-border/40 transition-all duration-300"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="aspect-square overflow-hidden bg-muted relative">
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    <div className="p-5">
                      <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">
                        {post.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                        {post.prompt}
                      </p>

                      <div className="flex items-center justify-between gap-4 text-sm mb-2">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Heart className="w-4 h-4" />
                            <span>{post.likes.length}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MessageCircle className="w-4 h-4" />
                            <span>{post.comments.length}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Eye className="w-4 h-4" />
                            <span>{post.post_views.length}</span>
                          </div>
                        </div>
                      </div>
                      <div onClick={(e) => e.preventDefault()}>
                        <BookmarkButton postId={post.id} variant="outline" size="sm" showLabel={false} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="glass-effect rounded-3xl p-16 text-center border border-border/40 animate-fade-in">
              <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-xl text-muted-foreground mb-6 max-w-md mx-auto">
                {isOwnProfile 
                  ? "You haven't created any posts yet. Start sharing your creativity!" 
                  : `${profile?.username} hasn't shared any posts yet.`}
              </p>
              {isOwnProfile && (
                <Link to="/create">
                  <Button variant="default" size="lg" className="gap-2">
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
