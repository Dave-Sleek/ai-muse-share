import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Target, Users, Heart, ImageIcon, Plus, Trash2, Trophy, TrendingUp, Sparkles } from "lucide-react";

interface UserGoal {
  id: string;
  goal_type: "followers" | "likes" | "posts";
  target_value: number;
  current_value: number;
  start_date: string;
  end_date: string | null;
  is_completed: boolean;
}

const MILESTONES = [25, 50, 75] as const;

interface GoalSettingProps {
  userId: string;
  currentStats: {
    followers: number;
    likes: number;
    posts: number;
  };
}

const GOAL_CONFIG = {
  followers: {
    icon: Users,
    label: "Followers",
    color: "primary",
    description: "Grow your audience"
  },
  likes: {
    icon: Heart,
    label: "Likes",
    color: "secondary",
    description: "Increase engagement"
  },
  posts: {
    icon: ImageIcon,
    label: "Posts",
    color: "accent",
    description: "Create more content"
  }
};

const GoalSetting: React.FC<GoalSettingProps> = ({ userId, currentStats }) => {
  const { toast } = useToast();
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newGoalType, setNewGoalType] = useState<"followers" | "likes" | "posts">("followers");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, [userId]);

  useEffect(() => {
    if (goals.length > 0) {
      updateGoalProgress();
    }
  }, [currentStats, goals.length]);

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from("user_goals")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setGoals((data as UserGoal[]) || []);
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateGoalProgress = async () => {
    for (const goal of goals) {
      const currentValue = currentStats[goal.goal_type];
      const isCompleted = currentValue >= goal.target_value;
      const oldProgress = (goal.current_value / goal.target_value) * 100;
      const newProgress = (currentValue / goal.target_value) * 100;

      if (goal.current_value !== currentValue || goal.is_completed !== isCompleted) {
        await supabase
          .from("user_goals")
          .update({ 
            current_value: currentValue,
            is_completed: isCompleted
          })
          .eq("id", goal.id);

        // Check for milestone celebrations
        for (const milestone of MILESTONES) {
          if (oldProgress < milestone && newProgress >= milestone && newProgress < 100) {
            toast({
              title: `${milestone}% Milestone Reached! 🎯`,
              description: `Amazing progress on your ${GOAL_CONFIG[goal.goal_type].label.toLowerCase()} goal!`,
            });
            break; // Only show one milestone notification at a time
          }
        }

        if (isCompleted && !goal.is_completed) {
          toast({
            title: "Goal Completed! 🎉",
            description: `You've reached your ${goal.goal_type} goal of ${goal.target_value}!`,
          });
        }
      }
    }
  };

  const handleCreateGoal = async () => {
    const target = parseInt(newGoalTarget);
    if (!target || target <= 0) {
      toast({
        title: "Invalid target",
        description: "Please enter a valid target number",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const currentValue = currentStats[newGoalType];
      const isCompleted = currentValue >= target;

      const { error } = await supabase
        .from("user_goals")
        .upsert({
          user_id: userId,
          goal_type: newGoalType,
          target_value: target,
          current_value: currentValue,
          is_completed: isCompleted
        }, {
          onConflict: "user_id,goal_type"
        });

      if (error) throw error;

      toast({
        title: "Goal set!",
        description: `Your ${GOAL_CONFIG[newGoalType].label.toLowerCase()} goal has been created.`
      });

      setDialogOpen(false);
      setNewGoalTarget("");
      fetchGoals();
    } catch (error: any) {
      toast({
        title: "Error creating goal",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from("user_goals")
        .delete()
        .eq("id", goalId);

      if (error) throw error;

      setGoals(goals.filter(g => g.id !== goalId));
      toast({
        title: "Goal deleted",
        description: "Your goal has been removed."
      });
    } catch (error: any) {
      toast({
        title: "Error deleting goal",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const existingGoalTypes = goals.map(g => g.goal_type);
  const availableGoalTypes = (Object.keys(GOAL_CONFIG) as Array<keyof typeof GOAL_CONFIG>)
    .filter(type => !existingGoalTypes.includes(type));

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover-lift">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-secondary">
              <Target className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle>Your Goals</CardTitle>
              <CardDescription>Set targets and track your progress</CardDescription>
            </div>
          </div>
          {availableGoalTypes.length > 0 && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Goal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Set a New Goal</DialogTitle>
                  <DialogDescription>
                    Choose a metric and set your target to track your progress.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Goal Type</Label>
                    <Select 
                      value={newGoalType} 
                      onValueChange={(v: "followers" | "likes" | "posts") => setNewGoalType(v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableGoalTypes.map(type => {
                          const config = GOAL_CONFIG[type];
                          return (
                            <SelectItem key={type} value={type}>
                              <div className="flex items-center gap-2">
                                <config.icon className="w-4 h-4" />
                                {config.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Current: {currentStats[newGoalType]} {GOAL_CONFIG[newGoalType].label.toLowerCase()}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Target</Label>
                    <Input
                      type="number"
                      placeholder="Enter your target"
                      value={newGoalTarget}
                      onChange={(e) => setNewGoalTarget(e.target.value)}
                      min={1}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateGoal} disabled={saving}>
                    {saving ? "Creating..." : "Create Goal"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {goals.length === 0 ? (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">
              No goals set yet. Create your first goal to start tracking!
            </p>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Set Your First Goal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Set a New Goal</DialogTitle>
                  <DialogDescription>
                    Choose a metric and set your target to track your progress.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Goal Type</Label>
                    <Select 
                      value={newGoalType} 
                      onValueChange={(v: "followers" | "likes" | "posts") => setNewGoalType(v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(GOAL_CONFIG) as Array<keyof typeof GOAL_CONFIG>).map(type => {
                          const config = GOAL_CONFIG[type];
                          return (
                            <SelectItem key={type} value={type}>
                              <div className="flex items-center gap-2">
                                <config.icon className="w-4 h-4" />
                                {config.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Current: {currentStats[newGoalType]} {GOAL_CONFIG[newGoalType].label.toLowerCase()}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Target</Label>
                    <Input
                      type="number"
                      placeholder="Enter your target"
                      value={newGoalTarget}
                      onChange={(e) => setNewGoalTarget(e.target.value)}
                      min={1}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateGoal} disabled={saving}>
                    {saving ? "Creating..." : "Create Goal"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map(goal => {
              const config = GOAL_CONFIG[goal.goal_type];
              const Icon = config.icon;
              const progress = getProgressPercentage(goal.current_value, goal.target_value);
              const remaining = Math.max(goal.target_value - goal.current_value, 0);

              return (
                <div
                  key={goal.id}
                  className={`p-4 rounded-xl border ${goal.is_completed ? 'bg-green-500/10 border-green-500/30' : 'bg-card/50'}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${goal.is_completed ? 'bg-green-500/20' : 'bg-muted'}`}>
                        {goal.is_completed ? (
                          <Trophy className="w-5 h-5 text-green-500" />
                        ) : (
                          <Icon className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          {config.label} Goal
                          {goal.is_completed && (
                            <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">
                              Completed!
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {goal.is_completed 
                            ? `You've reached your goal of ${goal.target_value}!`
                            : `${remaining} more to reach your goal`
                          }
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteGoal(goal.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {goal.current_value} / {goal.target_value}
                      </span>
                    </div>
                    <Progress 
                      value={progress} 
                      className={`h-3 ${goal.is_completed ? '[&>div]:bg-green-500' : ''}`}
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{Math.round(progress)}% complete</span>
                      {!goal.is_completed && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Keep going!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoalSetting;
