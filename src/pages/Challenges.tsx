import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import { Trophy, Calendar, Users, Sparkles } from "lucide-react";
import { format } from "date-fns";

interface Challenge {
  id: string;
  title: string;
  description: string;
  theme: string;
  start_date: string;
  end_date: string;
  created_at: string;
  submission_count?: number;
}

const Challenges = () => {
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [upcomingChallenges, setUpcomingChallenges] = useState<Challenge[]>([]);
  const [pastChallenges, setPastChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const now = new Date().toISOString();

      // Fetch all challenges with submission counts
      const { data: challengesData, error } = await supabase
        .from("challenges")
        .select(`
          *,
          challenge_submissions(count)
        `)
        .order("start_date", { ascending: false });

      if (error) throw error;

      const challenges = challengesData?.map(c => ({
        ...c,
        submission_count: c.challenge_submissions?.[0]?.count || 0
      })) || [];

      // Split into active, upcoming, and past
      setActiveChallenges(
        challenges.filter(c => c.start_date <= now && c.end_date >= now)
      );
      setUpcomingChallenges(
        challenges.filter(c => c.start_date > now)
      );
      setPastChallenges(
        challenges.filter(c => c.end_date < now)
      );
    } catch (error) {
      console.error("Error fetching challenges:", error);
    } finally {
      setLoading(false);
    }
  };

  const ChallengeCard = ({ challenge, status }: { challenge: Challenge; status: "active" | "upcoming" | "past" }) => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/challenges/${challenge.id}`)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{challenge.title}</CardTitle>
            <CardDescription>{challenge.description}</CardDescription>
          </div>
          {status === "active" && (
            <Badge variant="default" className="bg-green-500">
              Active
            </Badge>
          )}
          {status === "upcoming" && (
            <Badge variant="secondary">
              Upcoming
            </Badge>
          )}
          {status === "past" && (
            <Badge variant="outline">
              Ended
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="w-4 h-4" />
          <span className="font-medium">Theme:</span>
          <span>{challenge.theme}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{format(new Date(challenge.start_date), "MMM d")} - {format(new Date(challenge.end_date), "MMM d, yyyy")}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{challenge.submission_count} {challenge.submission_count === 1 ? "submission" : "submissions"}</span>
        </div>

        <Button 
          variant={status === "active" ? "hero" : "outline"} 
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            if (status === "active") {
              navigate("/create", { state: { challengeId: challenge.id, challengeTitle: challenge.title } });
            } else {
              navigate(`/challenges/${challenge.id}`);
            }
          }}
        >
          {status === "active" ? "Submit Entry" : "View Challenge"}
        </Button>
      </CardContent>
    </Card>
  );

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

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Trophy className="w-12 h-12 text-primary" />
              <h1 className="text-4xl font-bold">Weekly Challenges</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Participate in themed challenges, showcase your creativity, and compete with the community
            </p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
              <TabsTrigger value="active">
                Active ({activeChallenges.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                Upcoming ({upcomingChallenges.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past ({pastChallenges.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              {activeChallenges.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No active challenges at the moment</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeChallenges.map((challenge) => (
                    <ChallengeCard key={challenge.id} challenge={challenge} status="active" />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="upcoming">
              {upcomingChallenges.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No upcoming challenges</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingChallenges.map((challenge) => (
                    <ChallengeCard key={challenge.id} challenge={challenge} status="upcoming" />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="past">
              {pastChallenges.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No past challenges</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pastChallenges.map((challenge) => (
                    <ChallengeCard key={challenge.id} challenge={challenge} status="past" />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Challenges;