import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BanUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  username: string;
  onSuccess: () => void;
}

export const BanUserDialog = ({
  open,
  onOpenChange,
  userId,
  username,
  onSuccess,
}: BanUserDialogProps) => {
  const [banType, setBanType] = useState<'permanent' | 'temporary'>('temporary');
  const [duration, setDuration] = useState('7');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleBan = async () => {
    setIsLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      let expiresAt: string | null = null;
      if (banType === 'temporary') {
        const days = parseInt(duration);
        if (isNaN(days) || days < 1) {
          toast.error('Please enter a valid number of days');
          setIsLoading(false);
          return;
        }
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + days);
        expiresAt = expDate.toISOString();
      }

      const { error } = await supabase.from('banned_users' as any).upsert(
        {
          user_id: userId,
          banned_by: userData.user.id,
          reason: reason || null,
          expires_at: expiresAt,
          is_active: true,
          banned_at: new Date().toISOString(),
        } as any,
        { onConflict: 'user_id' }
      );

      if (error) throw error;

      toast.success(
        banType === 'permanent'
          ? `${username} has been permanently banned`
          : `${username} has been suspended for ${duration} days`
      );
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('Failed to ban user');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setBanType('temporary');
    setDuration('7');
    setReason('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ban User: {username}</DialogTitle>
          <DialogDescription>
            This will prevent the user from accessing the platform.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Ban Type</Label>
            <RadioGroup value={banType} onValueChange={(v) => setBanType(v as 'permanent' | 'temporary')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="temporary" id="temporary" />
                <Label htmlFor="temporary" className="font-normal">
                  Temporary Suspension
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="permanent" id="permanent" />
                <Label htmlFor="permanent" className="font-normal">
                  Permanent Ban
                </Label>
              </div>
            </RadioGroup>
          </div>

          {banType === 'temporary' && (
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (days)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Number of days"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for the ban..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleBan} disabled={isLoading}>
            {isLoading ? 'Banning...' : banType === 'permanent' ? 'Ban Permanently' : 'Suspend User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
