export interface User {
  id: number;
  email: string;
  fullName: string;
  spiritualName?: string | null;
  phone?: string | null;
  city?: string | null;
  birthDate?: string | null;
  roles?: string[];
  parentId?: number | null;
  isActive?: boolean;
  childrenCount?: number;
  adminNotes?: string | null;
  isRegistered?: boolean;
  parent?: User;
  children?: User[];
}

export interface Child extends User {
  parentId: number;
}

export interface ChildFormData {
  id?: number | null;
  fullName: string;
  spiritualName?: string;
  birthDate: string;
  city: string;
  parentId: number;
} 