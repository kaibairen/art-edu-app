import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators';
import { HomeService } from './home.service';

@Controller('public')
export class PublicController {
  constructor(private readonly home: HomeService) {}

  @Public()
  @Get('home')
  homePage() {
    return this.home.publicHome();
  }

  @Public()
  @Get('settings')
  settings() {
    return this.home.publicSettings();
  }
}
