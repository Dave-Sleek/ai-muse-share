import { useEffect, useState, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BanCheckProviderProps {
  children: ReactNode;
}

export const BanCheckProvider = ({ children }: BanCheckProviderProps) => {
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

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
          // Sign out the banned user
          await supabase.auth.signOut();
          toast.error('Your account has been suspended. Please contact support for more information.');
          
          // Only redirect if not already on auth page
          if (location.pathname !== '/auth') {
            navigate('/auth');
          }
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
  }, [navigate, location.pathname]);

  // Show nothing while checking - prevents flash of content
  if (isChecking) {
    return null;
  }

  return <>{children}</>;
};
