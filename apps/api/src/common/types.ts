import { Role, UserStatus } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  role: Role;
  displayName: string;
}

export interface AuthUser {
  id: string;
  phone: string;
  role: Role;
  displayName: string;
  status: UserStatus;
}
