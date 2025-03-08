import 'next-auth';
import { UserAttributes } from '~/server/models/User';

declare module 'next-auth' {
  interface Session {
    user: {
      id: number;
      email: string;
      roles?: string[];
    } & Partial<UserAttributes>
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: number;
    email: string;
    roles?: string[];
  }
} 