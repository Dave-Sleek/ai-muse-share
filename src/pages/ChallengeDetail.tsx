import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { Trophy, Calendar, Sparkles, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

interface Challenge {
  id: string;
  title: string;
  description: string;
  theme: string;
  start_date: string;
  end_date: string;
}

interface Submission {
  id: string;
  submitted_at: string;
  post_id: string;
  posts: {
    id: string;
    title: string;
    image_url: string;
    user_id: string;
    profiles: {
      username: string;
      avatar_url: string;
    };
  };
}

const ChallengeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchChallengeDetails();
    }
  }, [id]);

  const fetchChallengeDetails = async () => {
    try {
      // Fetch challenge
      const { data: challengeData, error: challengeError } = await supabase
        .from("challenges")
        .select("*")
        .eq("id", id)
        .single();

      if (challengeError) throw challengeError;
      setChallenge(challengeData);

      // Fetch submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from("challenge_submissions")
        .select(`
          id,
          submitted_at,
          post_id,
          posts (
            id,
            title,
            image_url,
            user_id
          )
        `)
        .eq("challenge_id", id)
        .order("submitted_at", { ascending: false });

      if (submissionsError) throw submissionsError;

      // Fetch profiles for each submission
      if (submissionsData) {
        const userIds = submissionsData.map((s: any) => s.posts.user_id);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", userIds);

        const submissionsWithProfiles = submissionsData.map((submission: any) => ({
          ...submission,
          posts: {
            ...submission.posts,
            profiles: profilesData?.find((p: any) => p.id === submission.posts.user_id) || {
              username: "Unknown",
              avatar_url: null,
            },
          },
        }));

        setSubmissions(submissionsWithProfiles);
      }
    } catch (error) {
      console.error("Error fetching challenge details:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = () => {
    if (!challenge) return "past";
    const now = new Date();
    const start = new Date(challenge.start_date);
    const end = new Date(challenge.end_date);
    
    if (now >= start && now <= end) return "active";
    if (now < start) return "upcoming";
    return "past";
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 text-center">
          <p>Challenge not found</p>
        </div>
      </div>
    );
  }

  const status = getStatus();

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/challenges")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Challenges
          </Button>

          {/* Challenge Header */}
          <div className="glass-effect rounded-2xl p-8 mb-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">{challenge.title}</h1>
                  <p className="text-muted-foreground">{challenge.description}</p>
                </div>
              </div>
              {status === "active" && (
                <Badge variant="default" className="bg-green-500">Active</Badge>
              )}
              {status === "upcoming" && (
                <Badge variant="secondary">Upcoming</Badge>
              )}
              {status === "past" && (
                <Badge variant="outline">Ended</Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Theme</p>
                  <p className="font-medium">{challenge.theme}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">
                    {format(new Date(challenge.start_date), "MMM d")} - {format(new Date(challenge.end_date), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Submissions</p>
                  <p className="font-medium">{submissions.length}</p>
                </div>
              </div>
            </div>

            {status === "active" && (
              <Button
                variant="hero"
                size="lg"
                onClick={() => navigate("/create", { state: { challengeId: challenge.id, challengeTitle: challenge.title } })}
              >
                Submit Your Entry
              </Button>
            )}
          </div>

          {/* Submissions Grid */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Submissions ({submissions.length})</h2>
            {submissions.length === 0 ? (
              <div className="text-center py-12 glass-effect rounded-2xl">
                <p className="text-muted-foreground">No submissions yet. Be the first!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="group cursor-pointer"
                    onClick={() => navigate(`/post/${submission.posts.id}`)}
                  >
                    <div className="relative overflow-hidden rounded-lg aspect-square">
                      <img
                        src={submission.posts.image_url}
                        alt={submission.posts.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <p className="text-white font-medium text-sm truncate">
                            {submission.posts.title}
                          </p>
                          <p className="text-white/80 text-xs">
                            by {submission.posts.profiles.username}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeDetail;