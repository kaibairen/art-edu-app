import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AccessModule } from './access/access.module';
import { ArtworksModule } from './artworks/artworks.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { BrandModule } from './brand/brand.module';
import { ApiExceptionFilter } from './common/http-exception.filter';
import { HealthController } from './health.controller';
import { HomeModule } from './home/home.module';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AccessModule,
    StorageModule,
    AuthModule,
    UsersModule,
    ArtworksModule,
    BrandModule,
    HomeModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
