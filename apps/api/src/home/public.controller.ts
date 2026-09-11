import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators';
import { PrismaService } from '../prisma/prisma.service';
import { HomeService } from './home.service';

@Controller('public')
export class PublicController {
  constructor(
    private readonly home: HomeService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Get('home')
  async homePage() {
    const [settings, contents] = await Promise.all([
      this.prisma.orgSetting.findUnique({ where: { id: 'default' } }),
      this.home.listPublished(),
    ]);
    return {
      settings: settings ?? {
        orgName: '美术教培机构',
        logoUrl: null as string | null,
        watermarkText: '',
      },
      contents,
    };
  }

  @Public()
  @Get('settings')
  settings() {
    return this.prisma.orgSetting.findUnique({ where: { id: 'default' } });
  }
}
