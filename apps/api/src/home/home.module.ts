import { Module } from '@nestjs/common';
import { AdminHomeController } from './admin-home.controller';
import { HomeService } from './home.service';
import { PublicController } from './public.controller';

@Module({
  controllers: [AdminHomeController, PublicController],
  providers: [HomeService],
})
export class HomeModule {}
