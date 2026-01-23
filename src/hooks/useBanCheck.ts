import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useBanCheck = () => {
  const [isBanned, setIsBanned] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkBanStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsChecking(false);
          return;
        }

        // Check if user is banned using the database function
        const { data, error } = await supabase.rpc('is_user_banned', { 
          _user_id: user.id 
        });

        if (error) {
          console.error('Error checking ban status:', error);
          setIsChecking(false);
          return;
        }

        if (data === true) {
          setIsBanned(true);
          // Sign out the banned user
          await supabase.auth.signOut();
          toast.error('Your account has been suspended. Please contact support for more information.');
          navigate('/auth');
        }
      } catch (error) {
        console.error('Error in ban check:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkBanStatus();

    // Also check on auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        checkBanStatus();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return { isBanned, isChecking };
};
