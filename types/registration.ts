import type { User } from './user';
import type { Festival } from './festival';
import type { FestivalDepartment } from './festival';

export interface FestivalRegistration {
  id: number;
  userId: number;
  festivalId: number;
  arrivalDate: string;
  departureDate: string;
  hasCar: boolean;
  freeSeatsInCar: number;
  hasPet: boolean;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
  User?: User;
  Festival?: Festival;
  Departments?: FestivalDepartment[];
  RegistrationChildren?: FestivalRegistrationChild[];
  children?: {
    id: number;
    fullName: string;
    birthDate?: string | null;
    needsSeparateBed: boolean;
  }[];
}

export interface FestivalRegistrationChild {
  id: number;
  registrationId: number;
  childId: number;
  needsSeparateBed: boolean;
  createdAt?: string;
  updatedAt?: string;
  Child?: User;
}

export interface FestivalRegistrationFormData {
  arrivalDate: string;
  departureDate: string;
  hasCar: boolean;
  freeSeatsInCar: number;
  hasPet: boolean;
  notes: string;
  departmentIds: number[];
  children: {
    id: number;
    needsSeparateBed: boolean;
  }[];
} 