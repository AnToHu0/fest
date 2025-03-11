export enum PlacementStatus {
  BOOKED = 'booked',    // забронировано
  PAID = 'paid',        // оплачено
  SETTLED = 'settled',  // расселено
  SPECIAL = 'special'   // спец-гость
}

export interface Room {
  id: number;
  building: number;
  floor: number;
  number: number;
  size: number;
  description: string;
  placements?: Placement[];
}

export interface Placement {
  id: number;
  roomId: number;
  slot: number;
  managerId: number;
  userId: number;
  type: PlacementStatus;
  datefrom: string | null;
  dateto: string | null;
  comment: string;
  user?: {
    id: number;
    fullName: string;
    email: string;
  };
}

export interface PlacementFormData {
  roomId: number;
  slot: number;
  userId: number;
  type: PlacementStatus;
  datefrom: string | null;
  dateto: string | null;
  comment: string;
  children?: ChildFormData[];
}

export interface ChildFormData {
  id: number;
  childId: number;
  needsSeparateBed: boolean;
  selected: boolean;
  fullName?: string;
  birthdate?: string;
  spiritualName?: string;
}

export interface UserChild {
  id: number;
  childId: number;
  registrationId: number;
  needsSeparateBed: boolean;
  fullName: string;
  birthdate: string | null;
  spiritualName: string;
} 