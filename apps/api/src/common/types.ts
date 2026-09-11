import { Role } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  role: Role;
  name: string;
}

export interface AuthUser {
  id: string;
  phone: string;
  email: string | null;
  name: string;
  role: Role;
}
