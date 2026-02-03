import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const finishAuth = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
      if (error) {
        toast({
          title: 'Error',
          description: 'No se pudo completar el acceso con Google',
          variant: 'destructive',
        });
        navigate('/login', { replace: true });
        return;
      }

      // Clean URL and go to app
      window.history.replaceState({}, document.title, '/');
      navigate('/mis-vacaciones', { replace: true });
    };

    finishAuth();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}
