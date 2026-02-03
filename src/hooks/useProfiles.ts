import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Profile {
  id: string;
  email: string;
  name: string;
  birth_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserWithRole extends Profile {
  role: 'admin' | 'employee';
}

const toDateString = (date: Date) => format(date, 'yyyy-MM-dd');

// Fetch all profiles with roles (admin only)
export function useAllProfiles() {
  return useQuery({
    queryKey: ['profiles', 'all'],
    queryFn: async () => {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('name');

      if (profilesError) throw profilesError;

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles: UserWithRole[] = profiles.map((profile: Profile) => {
        const userRole = roles.find((r: any) => r.user_id === profile.id);
        return {
          ...profile,
          role: (userRole?.role as 'admin' | 'employee') || 'employee',
        };
      });

      return usersWithRoles;
    },
  });
}

// Update profile birth date (admin)
export function useUpdateProfileBirthDate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { userId: string; birthDate: Date }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          birth_date: toDateString(data.birthDate),
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast({
        title: 'Fecha actualizada',
        description: 'La fecha de nacimiento ha sido modificada',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Update user role (admin)
export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { userId: string; role: 'admin' | 'employee' }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: data.role })
        .eq('user_id', data.userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast({
        title: 'Rol actualizado',
        description: 'El rol del usuario ha sido modificado',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
