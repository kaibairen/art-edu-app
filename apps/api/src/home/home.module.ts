import { Module } from '@nestjs/common';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { PublicController } from './public.controller';

@Module({
  controllers: [HomeController, PublicController],
  providers: [HomeService],
})
export class HomeModule {}
