export type VacationRequestStatus = 'approved' | 'pending' | 'rejected';
export type VacationType = 'regular' | 'birthday' | 'holiday' | 'christmas';

export interface VacationRequest {
  id: string;
  userId: string;
  userName: string;
  startDate: Date;
  endDate: Date;
  type: VacationType;
  status: VacationRequestStatus;
  daysCount: number;
  createdAt: Date;
}

export interface ChristmasOption {
  id: string;
  year: number;
  optionLabel: 'A' | 'B';
  startDate: Date;
  endDate: Date;
}

export interface UserChristmasChoice {
  userId: string;
  year: number;
  optionLabel: 'A' | 'B';
}

export interface VacationBalance {
  year: number;
  baseDays: number;
  usedDays: number;
  remainingDays: number;
}
