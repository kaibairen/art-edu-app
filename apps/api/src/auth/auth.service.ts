import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from '../common/dto';
import { AuthUser, JwtPayload } from '../common/types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const account = dto.account.trim();
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ phone: account }, { email: account }],
      },
    });
    if (!user) {
      throw new UnauthorizedException('账号或密码错误');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('账号或密码错误');
    }
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      name: user.name,
    };
    const accessToken = await this.jwt.signAsync(payload);
    return {
      accessToken,
      user: this.toAuthUser(user),
    };
  }

  toAuthUser(user: {
    id: string;
    phone: string;
    email: string | null;
    name: string;
    role: AuthUser['role'];
  }): AuthUser {
    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}
