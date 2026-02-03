import { VacationRequest, ChristmasOption, UserChristmasChoice } from '@/types/vacation';

// Datos de prueba para vacaciones
export const mockVacationRequests: VacationRequest[] = [
  {
    id: '1',
    userId: '1',
    userName: 'Marc Admin',
    startDate: new Date('2026-03-15'),
    endDate: new Date('2026-03-20'),
    type: 'regular',
    status: 'approved',
    daysCount: 4,
    createdAt: new Date('2026-01-10'),
  },
  {
    id: '2',
    userId: '1',
    userName: 'Marc Admin',
    startDate: new Date('2026-07-01'),
    endDate: new Date('2026-07-15'),
    type: 'regular',
    status: 'approved',
    daysCount: 11,
    createdAt: new Date('2026-02-15'),
  },
  {
    id: '3',
    userId: '2',
    userName: 'Juan Empleado',
    startDate: new Date('2026-08-10'),
    endDate: new Date('2026-08-24'),
    type: 'regular',
    status: 'approved',
    daysCount: 11,
    createdAt: new Date('2026-03-01'),
  },
  {
    id: '4',
    userId: '2',
    userName: 'Juan Empleado',
    startDate: new Date('2026-05-15'),
    endDate: new Date('2026-05-15'),
    type: 'birthday',
    status: 'approved',
    daysCount: 1,
    createdAt: new Date('2026-01-05'),
  },
];

// Opciones de Navidad configuradas por admin
export const mockChristmasOptions: ChristmasOption[] = [
  {
    id: '1',
    year: 2026,
    optionLabel: 'A',
    startDate: new Date('2026-12-21'),
    endDate: new Date('2026-12-27'),
  },
  {
    id: '2',
    year: 2026,
    optionLabel: 'B',
    startDate: new Date('2026-12-28'),
    endDate: new Date('2027-01-03'),
  },
  {
    id: '3',
    year: 2027,
    optionLabel: 'A',
    startDate: new Date('2027-12-20'),
    endDate: new Date('2027-12-26'),
  },
  {
    id: '4',
    year: 2027,
    optionLabel: 'B',
    startDate: new Date('2027-12-27'),
    endDate: new Date('2028-01-02'),
  },
];

// Elecciones de Navidad de usuarios
export const mockUserChristmasChoices: UserChristmasChoice[] = [
  { userId: '1', year: 2026, optionLabel: 'A' },
  { userId: '2', year: 2026, optionLabel: 'B' },
];

// Días festivos fijos de la empresa
export const companyHolidays = [
  { date: new Date('2026-12-24'), name: 'Nochebuena' },
  { date: new Date('2026-12-31'), name: 'Nochevieja' },
  { date: new Date('2027-12-24'), name: 'Nochebuena' },
  { date: new Date('2027-12-31'), name: 'Nochevieja' },
];

// Configuración base
export const VACATION_CONFIG = {
  baseDaysPerYear: 22,
  currentYear: 2026,
  adminEmail: 'sendingbay.marc@gmail.com',
};
