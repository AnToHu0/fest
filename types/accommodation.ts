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
}

export interface UserChild {
  id: number;
  userId: number;
  fullName: string;
  birthdate: string;
  needsBed: boolean;
} 