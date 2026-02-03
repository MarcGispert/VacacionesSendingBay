import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface VacationRequest {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  type: 'regular' | 'birthday' | 'holiday' | 'christmas';
  status: 'approved' | 'pending' | 'rejected';
  days_count: number;
  created_at: string;
  // Joined from profiles
  user_name?: string;
}

export interface ChristmasOption {
  id: string;
  year: number;
  option_label: string;
  start_date: string;
  end_date: string;
}

export interface UserChristmasChoice {
  id: string;
  user_id: string;
  year: number;
  option_label: string;
}

export interface UserChristmasChoiceWithName extends UserChristmasChoice {
  user_name?: string;
}

export interface UserBirthdayDay {
  id: string;
  user_id: string;
  year: number;
  selected_date: string;
}

export interface UserBirthdayDayWithName extends UserBirthdayDay {
  user_name?: string;
}

const toDateString = (date: Date) => format(date, 'yyyy-MM-dd');

// Fetch all vacation requests (for calendar view)
export function useAllVacations() {
  return useQuery({
    queryKey: ['vacations', 'all'],
    queryFn: async () => {
      // Fetch vacations
      const { data: vacations, error: vacationsError } = await supabase
        .from('vacation_requests')
        .select('*')
        .eq('status', 'approved');

      if (vacationsError) throw vacationsError;
      
      // Get unique user IDs
      const userIds = [...new Set(vacations.map(v => v.user_id))];
      
      // Fetch names for each user using the security definer function
      const namesMap: Record<string, string> = {};
      for (const userId of userIds) {
        const { data, error } = await supabase.rpc('get_profile_name', { _user_id: userId });
        if (!error && data) {
          namesMap[userId] = data;
        }
      }
      
      return vacations.map((v: any) => ({
        ...v,
        user_name: namesMap[v.user_id] || 'Unknown',
      })) as VacationRequest[];
    },
  });
}

// Fetch user's own vacation requests
export function useMyVacations() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['vacations', 'my', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('vacation_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as VacationRequest[];
    },
    enabled: !!user,
  });
}

// Create vacation request
export function useCreateVacation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      startDate: Date;
      endDate: Date;
      type: 'regular' | 'birthday' | 'holiday' | 'christmas';
      daysCount: number;
    }) => {
      if (!user) throw new Error('No user');

      const { error } = await supabase.from('vacation_requests').insert({
        user_id: user.id,
        start_date: toDateString(data.startDate),
        end_date: toDateString(data.endDate),
        type: data.type,
        status: 'approved',
        days_count: data.daysCount,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacations'] });
      toast({
        title: '¡Vacaciones solicitadas!',
        description: 'Tu solicitud ha sido registrada',
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

// Delete vacation request
export function useDeleteVacation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('vacation_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacations'] });
      toast({
        title: 'Solicitud eliminada',
        description: 'La solicitud ha sido eliminada',
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

// Fetch Christmas options
export function useChristmasOptions(year: number) {
  return useQuery({
    queryKey: ['christmas-options', year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('christmas_options')
        .select('*')
        .eq('year', year)
        .order('option_label');

      if (error) throw error;
      return data as ChristmasOption[];
    },
  });
}

// Fetch all Christmas options (for admin)
export function useAllChristmasOptions() {
  return useQuery({
    queryKey: ['christmas-options', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('christmas_options')
        .select('*')
        .order('year')
        .order('option_label');

      if (error) throw error;
      return data as ChristmasOption[];
    },
  });
}

// Update Christmas option (admin)
export function useUpdateChristmasOption() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      startDate?: Date;
      endDate?: Date;
    }) => {
      const updateData: any = {};
      if (data.startDate) updateData.start_date = toDateString(data.startDate);
      if (data.endDate) updateData.end_date = toDateString(data.endDate);

      const { error } = await supabase
        .from('christmas_options')
        .update(updateData)
        .eq('id', data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['christmas-options'] });
      toast({
        title: 'Configuración actualizada',
        description: 'Las opciones de Navidad han sido actualizadas',
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

// Fetch user's Christmas choice
export function useMyChristmasChoice(year: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['christmas-choice', user?.id, year],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_christmas_choices')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', year)
        .maybeSingle();

      if (error) throw error;
      return data as UserChristmasChoice | null;
    },
    enabled: !!user,
  });
}

// Fetch all Christmas choices for a year (for team calendar)
export function useAllChristmasChoices(year: number) {
  return useQuery({
    queryKey: ['christmas-choice', 'all', year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_christmas_choices')
        .select('*')
        .eq('year', year);

      if (error) throw error;

      const choices = data as UserChristmasChoice[];
      const userIds = [...new Set(choices.map((c) => c.user_id))];

      const namesMap: Record<string, string> = {};
      for (const userId of userIds) {
        const { data: name, error: nameError } = await supabase.rpc('get_profile_name', { _user_id: userId });
        if (!nameError && name) {
          namesMap[userId] = name;
        }
      }

      return choices.map((choice) => ({
        ...choice,
        user_name: namesMap[choice.user_id] || 'Usuario',
      })) as UserChristmasChoiceWithName[];
    },
  });
}

// Save Christmas choice
export function useSaveChristmasChoice() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { year: number; optionLabel: string }) => {
      if (!user) throw new Error('No user');

      const { error } = await supabase
        .from('user_christmas_choices')
        .upsert({
          user_id: user.id,
          year: data.year,
          option_label: data.optionLabel,
        }, {
          onConflict: 'user_id,year',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['christmas-choice'] });
      toast({
        title: 'Elección guardada',
        description: 'Tu elección de Navidad ha sido guardada',
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

// Fetch user's birthday day
export function useMyBirthdayDay(year: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['birthday-day', user?.id, year],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_birthday_days')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', year)
        .maybeSingle();

      if (error) throw error;
      return data as UserBirthdayDay | null;
    },
    enabled: !!user,
  });
}

// Fetch all birthday days for a year (for team calendar)
export function useAllBirthdayDays(year: number) {
  return useQuery({
    queryKey: ['birthday-day', 'all', year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_birthday_days')
        .select('*')
        .eq('year', year);

      if (error) throw error;

      const birthdays = data as UserBirthdayDay[];
      const userIds = [...new Set(birthdays.map((b) => b.user_id))];

      const namesMap: Record<string, string> = {};
      for (const userId of userIds) {
        const { data: name, error: nameError } = await supabase.rpc('get_profile_name', { _user_id: userId });
        if (!nameError && name) {
          namesMap[userId] = name;
        }
      }

      return birthdays.map((birthday) => ({
        ...birthday,
        user_name: namesMap[birthday.user_id] || 'Usuario',
      })) as UserBirthdayDayWithName[];
    },
  });
}

// Save birthday day
export function useSaveBirthdayDay() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { year: number; selectedDate: Date }) => {
      if (!user) throw new Error('No user');

      const { error } = await supabase
        .from('user_birthday_days')
        .upsert({
          user_id: user.id,
          year: data.year,
          selected_date: toDateString(data.selectedDate),
        }, {
          onConflict: 'user_id,year',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['birthday-day'] });
      toast({
        title: 'Fecha guardada',
        description: 'Tu día de cumpleaños ha sido guardado',
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
