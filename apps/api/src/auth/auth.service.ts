import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RefreshDto } from '../common/dto';
import { Errors, LOGIN_BAD_CREDENTIALS } from '../common/errors';
import { toAuthMe } from '../common/mappers';
import { AuthUser, JwtPayload } from '../common/types';

const loginHits = new Map<string, number[]>();

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto, clientKey = 'unknown') {
    this.assertLoginRate(dto.phone, clientKey);
    const phone = dto.phone.trim();
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      throw Errors.unauthorized(LOGIN_BAD_CREDENTIALS);
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw Errors.unauthorized(LOGIN_BAD_CREDENTIALS);
    }
    if (user.status === UserStatus.disabled) {
      throw Errors.accountDisabled();
    }
    return this.issueTokens(user);
  }

  async refresh(dto: RefreshDto) {
    const tokenHash = hashToken(dto.refreshToken);
    const row = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!row || row.revokedAt || row.expiresAt.getTime() <= Date.now()) {
      throw Errors.unauthorized();
    }
    if (row.user.status === UserStatus.disabled) {
      throw Errors.unauthorized();
    }
    await this.prisma.refreshToken.update({
      where: { id: row.id },
      data: { revokedAt: new Date() },
    });
    return this.issueTokens(row.user);
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(user: AuthUser) {
    const fresh = await this.prisma.user.findUnique({ where: { id: user.id } });
    if (!fresh || fresh.status === UserStatus.disabled) {
      throw Errors.unauthorized();
    }
    return toAuthMe(fresh);
  }

  private async issueTokens(user: {
    id: string;
    role: AuthUser['role'];
    displayName: string;
  }) {
    const expiresIn = parseDurationSeconds(
      this.config.get<string>('JWT_EXPIRES_IN') ?? '2h',
    );
    const refreshDays = Number(this.config.get('JWT_REFRESH_DAYS') ?? 30);
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      displayName: user.displayName,
    };
    const accessToken = await this.jwt.signAsync(payload, { expiresIn });
    const refreshToken = randomBytes(32).toString('hex');
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000),
      },
    });
    return {
      accessToken,
      role: user.role,
      displayName: user.displayName,
      refreshToken,
      expiresIn,
    };
  }

  private assertLoginRate(phone: string, clientKey: string) {
    const key = `${clientKey}:${phone}`;
    const now = Date.now();
    const windowMs = 60_000;
    const max = 20;
    const hits = (loginHits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (hits.length >= max) {
      throw Errors.rateLimited();
    }
    hits.push(now);
    loginHits.set(key, hits);
  }
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function parseDurationSeconds(value: string): number {
  const match = /^(\d+)([smhd])?$/.exec(value.trim());
  if (!match) {
    return 7200;
  }
  const n = Number(match[1]);
  const unit = match[2] ?? 's';
  const mul =
    unit === 'd' ? 86400 : unit === 'h' ? 3600 : unit === 'm' ? 60 : 1;
  return n * mul;
}
