import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAdminRole = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        setUserId(user.id);

        const { data: roles, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching user roles:', error);
          setIsLoading(false);
          return;
        }

        const userRoles = roles?.map(r => r.role) || [];
        setIsAdmin(userRoles.includes('admin'));
        setIsModerator(userRoles.includes('moderator') || userRoles.includes('admin'));
      } catch (error) {
        console.error('Error checking admin role:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { isAdmin, isModerator, isLoading, userId };
};
