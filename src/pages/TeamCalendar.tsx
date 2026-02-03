import { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
  isWithinInterval,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAllVacations, useAllChristmasChoices, useChristmasOptions, useAllBirthdayDays } from '@/hooks/useVacations';

const toLocalDate = (dateString: string) => new Date(`${dateString}T00:00:00`);

const userColorClasses = [
  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100',
  'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
  'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-100',
  'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100',
  'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100',
  'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100',
  'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-100',
  'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
  'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-100',
  'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-100',
  'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-100',
  'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100',
  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  'bg-stone-100 text-stone-800 dark:bg-stone-900 dark:text-stone-100',
  'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100',
  'bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-100',
  'bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-100',
];

const typeBorderClasses: Record<string, string> = {
  regular: 'border-blue-400/60',
  birthday: 'border-pink-400/60',
  holiday: 'border-red-400/60',
  christmas: 'border-green-400/60',
};

const getCompanyHolidaysForYear = (year: number) => ([
  { date: new Date(year, 11, 24), name: '24 Diciembre' },
  { date: new Date(year, 11, 31), name: '31 Diciembre' },
]);

const typeColors: Record<string, string> = {
  regular: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  birthday: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100',
  holiday: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  christmas: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
};

const typeLabels: Record<string, string> = {
  regular: 'Vacaciones',
  birthday: 'Cumpleaños',
  holiday: 'Festivo',
  christmas: 'Navidad',
};

const nationalHolidaysByYear: Record<number, { date: Date; name: string }[]> = {
  2026: [
    { date: new Date(2026, 0, 1), name: 'Año Nuevo' },
    { date: new Date(2026, 0, 6), name: 'Epifanía del Señor' },
    { date: new Date(2026, 3, 3), name: 'Viernes Santo' },
    { date: new Date(2026, 4, 1), name: 'Fiesta del Trabajo' },
    { date: new Date(2026, 7, 15), name: 'Asunción de la Virgen' },
    { date: new Date(2026, 9, 12), name: 'Fiesta Nacional de España' },
    { date: new Date(2026, 10, 1), name: 'Todos los Santos' },
    { date: new Date(2026, 11, 6), name: 'Día de la Constitución' },
    { date: new Date(2026, 11, 8), name: 'Inmaculada Concepción' },
    { date: new Date(2026, 11, 25), name: 'Navidad' },
  ],
  2027: [
    { date: new Date(2027, 0, 1), name: 'Año Nuevo' },
    { date: new Date(2027, 0, 6), name: 'Epifanía del Señor' },
    { date: new Date(2027, 2, 26), name: 'Viernes Santo' },
    { date: new Date(2027, 4, 1), name: 'Fiesta del Trabajo' },
    { date: new Date(2027, 7, 15), name: 'Asunción de la Virgen' },
    { date: new Date(2027, 9, 12), name: 'Fiesta Nacional de España' },
    { date: new Date(2027, 10, 1), name: 'Todos los Santos' },
    { date: new Date(2027, 11, 6), name: 'Día de la Constitución' },
    { date: new Date(2027, 11, 8), name: 'Inmaculada Concepción' },
    { date: new Date(2027, 11, 25), name: 'Navidad' },
  ],
  2028: [
    { date: new Date(2028, 0, 1), name: 'Año Nuevo' },
    { date: new Date(2028, 0, 6), name: 'Epifanía del Señor' },
    { date: new Date(2028, 3, 14), name: 'Viernes Santo' },
    { date: new Date(2028, 4, 1), name: 'Fiesta del Trabajo' },
    { date: new Date(2028, 7, 15), name: 'Asunción de la Virgen' },
    { date: new Date(2028, 9, 12), name: 'Fiesta Nacional de España' },
    { date: new Date(2028, 10, 1), name: 'Todos los Santos' },
    { date: new Date(2028, 11, 6), name: 'Día de la Constitución' },
    { date: new Date(2028, 11, 8), name: 'Inmaculada Concepción' },
    { date: new Date(2028, 11, 25), name: 'Navidad' },
  ],
  2029: [
    { date: new Date(2029, 0, 1), name: 'Año Nuevo' },
    { date: new Date(2029, 0, 6), name: 'Epifanía del Señor' },
    { date: new Date(2029, 2, 30), name: 'Viernes Santo' },
    { date: new Date(2029, 4, 1), name: 'Fiesta del Trabajo' },
    { date: new Date(2029, 7, 15), name: 'Asunción de la Virgen' },
    { date: new Date(2029, 9, 12), name: 'Fiesta Nacional de España' },
    { date: new Date(2029, 10, 1), name: 'Todos los Santos' },
    { date: new Date(2029, 11, 6), name: 'Día de la Constitución' },
    { date: new Date(2029, 11, 8), name: 'Inmaculada Concepción' },
    { date: new Date(2029, 11, 25), name: 'Navidad' },
  ],
  2030: [
    { date: new Date(2030, 0, 1), name: 'Año Nuevo' },
    { date: new Date(2030, 0, 6), name: 'Epifanía del Señor' },
    { date: new Date(2030, 3, 19), name: 'Viernes Santo' },
    { date: new Date(2030, 4, 1), name: 'Fiesta del Trabajo' },
    { date: new Date(2030, 7, 15), name: 'Asunción de la Virgen' },
    { date: new Date(2030, 9, 12), name: 'Fiesta Nacional de España' },
    { date: new Date(2030, 10, 1), name: 'Todos los Santos' },
    { date: new Date(2030, 11, 6), name: 'Día de la Constitución' },
    { date: new Date(2030, 11, 8), name: 'Inmaculada Concepción' },
    { date: new Date(2030, 11, 25), name: 'Navidad' },
  ],
};

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 2147483647;
  }
  return hash;
};

const getUserColorClass = (userId: string) => {
  const index = Math.abs(hashString(userId)) % userColorClasses.length;
  return userColorClasses[index];
};

export default function TeamCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 2, 1)); // Marzo 2026
  const { data: vacations = [], isLoading } = useAllVacations();
  const selectedYear = currentMonth.getFullYear();
  const { data: christmasOptions = [] } = useChristmasOptions(selectedYear);
  const { data: christmasChoices = [] } = useAllChristmasChoices(selectedYear);
  const { data: birthdayDays = [] } = useAllBirthdayDays(selectedYear);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate empty days at the start of the month to align with the day of the week
  const startDayOfWeek = getDay(monthStart);
  const emptyDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Monday = 0

  const christmasVacations = christmasChoices.flatMap((choice) => {
    const option = christmasOptions.find((o) => o.option_label === choice.option_label);
    if (!option) return [];
    return [{
      id: `christmas-${choice.user_id}-${choice.year}`,
      user_id: choice.user_id,
      user_name: choice.user_name || 'Usuario',
      start_date: option.start_date,
      end_date: option.end_date,
      type: 'christmas' as const,
      status: 'approved' as const,
      created_at: option.start_date,
    }];
  });

  const birthdayVacations = birthdayDays.map((birthday) => ({
    id: `birthday-${birthday.user_id}-${birthday.year}`,
    user_id: birthday.user_id,
    user_name: birthday.user_name || 'Usuario',
    start_date: birthday.selected_date,
    end_date: birthday.selected_date,
    type: 'birthday' as const,
    status: 'approved' as const,
    created_at: birthday.selected_date,
  }));

  const allVacations = [...vacations, ...christmasVacations, ...birthdayVacations];

  const getVacationsForDay = (day: Date) => {
    return allVacations.filter(
      (request) =>
        request.status === 'approved' &&
        isWithinInterval(day, { 
          start: toLocalDate(request.start_date), 
          end: toLocalDate(request.end_date) 
        })
    );
  };

  const isHoliday = (day: Date) => {
    const holidays = [
      ...getCompanyHolidaysForYear(day.getFullYear()),
      ...(nationalHolidaysByYear[day.getFullYear()] || []),
    ];
    return holidays.some((h) => isSameDay(h.date, day));
  };

  const getHolidayName = (day: Date) => {
    const holidays = [
      ...getCompanyHolidaysForYear(day.getFullYear()),
      ...(nationalHolidaysByYear[day.getFullYear()] || []),
    ];
    const match = holidays.find((h) => isSameDay(h.date, day));
    return match?.name;
  };

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const nameCounts = allVacations.reduce<Record<string, number>>((acc, vacation) => {
    const rawName = vacation.user_name || 'Usuario';
    const firstName = rawName.trim().split(/\s+/)[0] || 'Usuario';
    acc[firstName] = (acc[firstName] || 0) + 1;
    return acc;
  }, {});

  const getDisplayName = (fullName: string | undefined) => {
    const fallback = 'Usuario';
    if (!fullName) return fallback;
    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[0] || fallback;
    if ((nameCounts[firstName] || 0) > 1) {
      return fullName;
    }
    return firstName;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendario del Equipo</h1>
          <p className="text-muted-foreground">
            Visualiza las vacaciones de todo el equipo
          </p>
        </div>

        {/* Calendar Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={previousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {/* Week days header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map((day) => (
                    <div
                      key={day}
                      className="text-center text-sm font-medium text-muted-foreground py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells for alignment */}
                  {Array.from({ length: emptyDays }).map((_, index) => (
                    <div key={`empty-${index}`} className="min-h-24 p-1" />
                  ))}

                  {/* Month days */}
                  {monthDays.map((day) => {
                    const dayVacations = getVacationsForDay(day);
                    const holiday = isHoliday(day);
                    const holidayName = holiday ? getHolidayName(day) : undefined;
                    const isWeekend = getDay(day) === 0 || getDay(day) === 6;

                    return (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          'min-h-24 p-1 border rounded-md',
                          isWeekend && 'bg-muted/50',
                          holiday && 'bg-red-50 dark:bg-red-950/20'
                        )}
                      >
                        <div
                          className={cn(
                            'text-sm font-medium mb-1',
                            isWeekend && 'text-muted-foreground'
                          )}
                        >
                          {format(day, 'd')}
                        </div>
                        <div className="space-y-1">
                          {holiday && (
                            <div className="text-xs px-1 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 truncate">
                              {holidayName || 'Festivo'}
                            </div>
                          )}
                          {dayVacations.slice(0, 3).map((vacation) => (
                            <div
                              key={vacation.id}
                              className={cn(
                                'text-xs px-1 py-0.5 rounded truncate border',
                                getUserColorClass(vacation.user_id),
                                typeBorderClasses[vacation.type]
                              )}
                              title={`${vacation.user_name} - ${typeLabels[vacation.type]}`}
                            >
                              {vacation.type === 'birthday' ? `🎂 ${getDisplayName(vacation.user_name)}` : getDisplayName(vacation.user_name)}
                            </div>
                          ))}
                          {dayVacations.length > 3 && (
                            <div className="text-xs text-muted-foreground px-1">
                              +{dayVacations.length - 3} más
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Leyenda</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              El color de fondo identifica a la persona. El borde identifica el tipo de día.
            </p>
            <div className="flex flex-wrap gap-4">
              {Object.entries(typeLabels).map(([type, label]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className={cn('w-4 h-4 rounded border', typeColors[type], typeBorderClasses[type])} />
                  <span className="text-sm">{label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
