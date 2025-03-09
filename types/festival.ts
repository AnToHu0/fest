export interface Festival {
  id: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  availableBuildings: string[];
  announcementText: string;
  year: number;
  adultPrice: number;
  teenPrice: number;
  childPrice: number;
  petPrice: number;
  carPrice: number;
  createdAt?: string;
  updatedAt?: string;
  departments?: FestivalDepartment[];
  Departments?: FestivalDepartment[];
  isRegistered?: boolean;
}

export interface FestivalDepartment {
  id: number;
  title: string;
  joinText?: string;
}

export interface FestivalFormData {
  startDate: string;
  endDate: string;
  isActive: boolean;
  availableBuildings: string[];
  announcementText: string;
  year: number;
  adultPrice: number;
  teenPrice: number;
  childPrice: number;
  petPrice: number;
  carPrice: number;
  departments?: number[];
} 