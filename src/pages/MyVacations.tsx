import { useState, useEffect, useRef } from 'react';
import { format, differenceInBusinessDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Trash2, Gift, PartyPopper, TreePine } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  useMyVacations,
  useCreateVacation,
  useDeleteVacation,
  useChristmasOptions,
  useMyChristmasChoice,
  useSaveChristmasChoice,
  useMyBirthdayDay,
  useSaveBirthdayDay,
} from '@/hooks/useVacations';

const VACATION_CONFIG = {
  baseDaysPerYear: 22,
  currentYear: 2026,
};

const statusConfig = {
  approved: { label: 'Aprobado', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' },
  pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' },
  rejected: { label: 'Rechazado', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' },
};

const typeLabels: Record<string, string> = {
  regular: 'Vacaciones',
  birthday: 'Cumpleaños',
  holiday: 'Festivo',
  christmas: 'Navidad',
};

const toLocalDate = (dateString: string) => new Date(`${dateString}T00:00:00`);

export default function MyVacations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState(VACATION_CONFIG.currentYear);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  // Queries
  const { data: vacations = [], isLoading: vacationsLoading } = useMyVacations();
  const { data: christmasOptions = [] } = useChristmasOptions(selectedYear);
  const { data: christmasChoice } = useMyChristmasChoice(selectedYear);
  const { data: birthdayDay } = useMyBirthdayDay(selectedYear);

  // Mutations
  const createVacation = useCreateVacation();
  const deleteVacation = useDeleteVacation();
  const saveChristmasChoice = useSaveChristmasChoice();
  const saveBirthdayDay = useSaveBirthdayDay();

  // Local state for birthday date
  const [birthdayDate, setBirthdayDate] = useState<Date | undefined>(undefined);
  const [christmasChoiceLocal, setChristmasChoiceLocal] = useState<string>('A');
  const autoSavedBirthdayYearRef = useRef<number | null>(null);
  const autoSavedChristmasYearRef = useRef<number | null>(null);

  // Sync with server data
  useEffect(() => {
    if (birthdayDay?.selected_date) {
      setBirthdayDate(toLocalDate(birthdayDay.selected_date));
      return;
    }

    if (user?.birthDate) {
      const derivedDate = new Date(
        selectedYear,
        user.birthDate.getMonth(),
        user.birthDate.getDate()
      );
      setBirthdayDate(derivedDate);

      if (autoSavedBirthdayYearRef.current !== selectedYear) {
        autoSavedBirthdayYearRef.current = selectedYear;
        saveBirthdayDay.mutate({
          year: selectedYear,
          selectedDate: derivedDate,
        });
      }
    }
  }, [birthdayDay, user?.birthDate, selectedYear, saveBirthdayDay]);

  useEffect(() => {
    if (christmasChoice?.option_label) {
      setChristmasChoiceLocal(christmasChoice.option_label);
    }
  }, [christmasChoice]);

  useEffect(() => {
    if (christmasChoice?.option_label) {
      return;
    }

    if (christmasOptions.length > 0 && autoSavedChristmasYearRef.current !== selectedYear) {
      const optionA = christmasOptions.find((option) => option.option_label === 'A') || christmasOptions[0];
      if (optionA) {
        autoSavedChristmasYearRef.current = selectedYear;
        setChristmasChoiceLocal(optionA.option_label);
        saveChristmasChoice.mutate({
          year: selectedYear,
          optionLabel: optionA.option_label,
        });
      }
    }
  }, [christmasChoice, christmasOptions, selectedYear, saveChristmasChoice]);

  // Calculate balance
  const approvedRegularVacations = vacations.filter(
    (r) => r.status === 'approved' && r.type === 'regular'
  );
  const usedDays = approvedRegularVacations.reduce((sum, r) => sum + r.days_count, 0);
  const remainingDays = VACATION_CONFIG.baseDaysPerYear - usedDays;

  const handleRequestVacation = () => {
    if (!dateRange.from || !dateRange.to) {
      toast({
        title: 'Error',
        description: 'Selecciona un rango de fechas',
        variant: 'destructive',
      });
      return;
    }

    const daysCount = differenceInBusinessDays(dateRange.to, dateRange.from) + 1;

    if (daysCount > remainingDays) {
      toast({
        title: 'Error',
        description: `No tienes suficientes días disponibles. Te quedan ${remainingDays} días.`,
        variant: 'destructive',
      });
      return;
    }

    createVacation.mutate(
      {
        startDate: dateRange.from,
        endDate: dateRange.to,
        type: 'regular',
        daysCount,
      },
      {
        onSuccess: () => {
          setDateRange({ from: undefined, to: undefined });
          setIsDialogOpen(false);
        },
      }
    );
  };

  const handleDeleteRequest = (id: string) => {
    deleteVacation.mutate(id);
  };

  const handleBirthdayDateChange = (date: Date | undefined) => {
    setBirthdayDate(date);
    if (date) {
      saveBirthdayDay.mutate({
        year: selectedYear,
        selectedDate: date,
      });
    }
  };

  const handleChristmasChoiceChange = (value: string) => {
    setChristmasChoiceLocal(value);
    saveChristmasChoice.mutate({
      year: selectedYear,
      optionLabel: value,
    });
  };

  const christmasOption = christmasOptions.find(
    (option) => option.option_label === christmasChoiceLocal
  );

  const christmasRequest = christmasOption && user
    ? {
        id: `christmas-${user.id}-${selectedYear}`,
        user_id: user.id,
        start_date: christmasOption.start_date,
        end_date: christmasOption.end_date,
        type: 'christmas' as const,
        status: 'approved' as const,
        days_count: 0,
        created_at: new Date().toISOString(),
      }
    : null;

  const displayRequests = christmasRequest
    ? [...vacations, christmasRequest]
    : vacations;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mis Vacaciones</h1>
            <p className="text-muted-foreground">Gestiona tus días de vacaciones</p>
          </div>
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2027">2027</SelectItem>
              <SelectItem value="2028">2028</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Balance Panel */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Días Base</CardDescription>
              <CardTitle className="text-4xl">{VACATION_CONFIG.baseDaysPerYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">días por año</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Días Usados</CardDescription>
              <CardTitle className="text-4xl text-orange-600">{usedDays}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">días consumidos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Días Restantes</CardDescription>
              <CardTitle className={cn("text-4xl", remainingDays > 5 ? "text-green-600" : "text-red-600")}>
                {remainingDays}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">días disponibles</p>
            </CardContent>
          </Card>
        </div>

        {/* Extra Days Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Días Extra
            </CardTitle>
            <CardDescription>
              Días adicionales a tus vacaciones regulares
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Día de Cumpleaños */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-3">
                <PartyPopper className="h-8 w-8 text-pink-500" />
                <div>
                  <h4 className="font-medium">Día de Cumpleaños</h4>
                  <p className="text-sm text-muted-foreground">
                    Elige cualquier día del año para disfrutar
                  </p>
                </div>
              </div>
              <div className="w-full sm:w-auto sm:min-w-[220px]">
                <Input
                  type="date"
                  value={birthdayDate ? format(birthdayDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleBirthdayDateChange(value ? new Date(`${value}T00:00:00`) : undefined);
                  }}
                  min={`${selectedYear}-01-01`}
                  max={`${selectedYear}-12-31`}
                  className={cn(!birthdayDate && 'text-muted-foreground')}
                />
              </div>
            </div>

            {/* Festivos Empresa */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-3">
                <Gift className="h-8 w-8 text-red-500" />
                <div>
                  <h4 className="font-medium">Festivos de Empresa</h4>
                  <p className="text-sm text-muted-foreground">
                    24 y 31 de Diciembre (fijos)
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">24 Dic</Badge>
                <Badge variant="secondary">31 Dic</Badge>
              </div>
            </div>

            {/* Semana de Navidad */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-3">
                <TreePine className="h-8 w-8 text-green-600" />
                <div>
                  <h4 className="font-medium">Semana de Navidad</h4>
                  <p className="text-sm text-muted-foreground">
                    Elige entre Opción A u Opción B
                  </p>
                </div>
              </div>
              <Select
                value={christmasChoiceLocal}
                onValueChange={handleChristmasChoiceChange}
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {christmasOptions.map((option) => (
                    <SelectItem key={option.id} value={option.option_label}>
                      Opción {option.option_label}: {format(toLocalDate(option.start_date), 'd MMM', { locale: es })} - {format(toLocalDate(option.end_date), 'd MMM', { locale: es })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Requests Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Mis Solicitudes</CardTitle>
              <CardDescription>
                Historial de vacaciones solicitadas
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Solicitar Vacaciones
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Solicitar Vacaciones</DialogTitle>
                  <DialogDescription>
                    Selecciona el rango de fechas para tus vacaciones
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                    locale={es}
                    weekStartsOn={1}
                    className="pointer-events-auto w-full rounded-md border border-input bg-background p-3 shadow-sm"
                  />
                  {dateRange.from && dateRange.to && (
                    <p className="mt-4 text-sm text-center text-muted-foreground">
                      {differenceInBusinessDays(dateRange.to, dateRange.from) + 1} días laborables seleccionados
                    </p>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleRequestVacation}
                    disabled={createVacation.isPending}
                  >
                    {createVacation.isPending ? 'Guardando...' : 'Confirmar Solicitud'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {vacationsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {displayRequests
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((request) => (
                    <div
                      key={request.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border bg-card"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {format(toLocalDate(request.start_date), 'd MMM', { locale: es })} - {format(toLocalDate(request.end_date), 'd MMM yyyy', { locale: es })}
                          </span>
                          {request.days_count > 0 && (
                            <Badge variant="outline">{request.days_count} días</Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {typeLabels[request.type]}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={statusConfig[request.status].className}>
                          {statusConfig[request.status].label}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteRequest(request.id)}
                          disabled={deleteVacation.isPending || request.type === 'christmas'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                {displayRequests.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No tienes solicitudes de vacaciones
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
