import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  theme: string;
  start_date: string;
  end_date: string;
  submissions_count?: number;
}

export const ChallengeManagement = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    theme: '',
    start_date: '',
    end_date: '',
  });

  const fetchChallenges = async () => {
    setIsLoading(true);
    try {
      const { data: challengesData, error } = await supabase
        .from('challenges')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;

      // Fetch submission counts
      const challengeIds = challengesData?.map(c => c.id) || [];
      const { data: submissions } = await supabase
        .from('challenge_submissions')
        .select('challenge_id')
        .in('challenge_id', challengeIds);

      const submissionsMap = submissions?.reduce((acc, s) => {
        acc[s.challenge_id] = (acc[s.challenge_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const challengesWithCounts = challengesData?.map(c => ({
        ...c,
        submissions_count: submissionsMap[c.id] || 0,
      })) || [];

      setChallenges(challengesWithCounts);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      toast.error('Failed to fetch challenges');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingChallenge) {
        const { error } = await supabase
          .from('challenges')
          .update({
            title: formData.title,
            description: formData.description,
            theme: formData.theme,
            start_date: formData.start_date,
            end_date: formData.end_date,
          })
          .eq('id', editingChallenge.id);

        if (error) throw error;
        toast.success('Challenge updated successfully');
      } else {
        const { error } = await supabase
          .from('challenges')
          .insert({
            title: formData.title,
            description: formData.description,
            theme: formData.theme,
            start_date: formData.start_date,
            end_date: formData.end_date,
          });

        if (error) throw error;
        toast.success('Challenge created successfully');
      }

      setIsDialogOpen(false);
      setEditingChallenge(null);
      setFormData({ title: '', description: '', theme: '', start_date: '', end_date: '' });
      fetchChallenges();
    } catch (error) {
      console.error('Error saving challenge:', error);
      toast.error('Failed to save challenge');
    }
  };

  const handleEdit = (challenge: Challenge) => {
    setEditingChallenge(challenge);
    setFormData({
      title: challenge.title,
      description: challenge.description || '',
      theme: challenge.theme,
      start_date: challenge.start_date.split('T')[0],
      end_date: challenge.end_date.split('T')[0],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (challengeId: string) => {
    try {
      const { error } = await supabase
        .from('challenges')
        .delete()
        .eq('id', challengeId);

      if (error) throw error;

      toast.success('Challenge deleted successfully');
      fetchChallenges();
    } catch (error) {
      console.error('Error deleting challenge:', error);
      toast.error('Failed to delete challenge');
    }
  };

  const getChallengeStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) return <Badge variant="outline">Upcoming</Badge>;
    if (now > end) return <Badge variant="secondary">Ended</Badge>;
    return <Badge className="bg-green-500">Active</Badge>;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Challenge Management
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingChallenge(null);
              setFormData({ title: '', description: '', theme: '', start_date: '', end_date: '' });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              New Challenge
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingChallenge ? 'Edit Challenge' : 'Create Challenge'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="theme">Theme</Label>
                <Input
                  id="theme"
                  value={formData.theme}
                  onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                {editingChallenge ? 'Update Challenge' : 'Create Challenge'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Challenge</TableHead>
                  <TableHead>Theme</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {challenges.map((challenge) => (
                  <TableRow key={challenge.id}>
                    <TableCell className="font-medium">{challenge.title}</TableCell>
                    <TableCell>{challenge.theme}</TableCell>
                    <TableCell>{getChallengeStatus(challenge.start_date, challenge.end_date)}</TableCell>
                    <TableCell>{challenge.submissions_count}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(challenge.start_date).toLocaleDateString()} - {new Date(challenge.end_date).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(challenge)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Challenge?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. All submissions will also be deleted.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(challenge.id)}
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
            {challenges.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No challenges created yet
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
