import { Injectable } from '@nestjs/common';
import { UpdateSettingDto, UpdateTemplateDto } from '../common/dto';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  getSettings() {
    return this.prisma.orgSetting.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        orgName: '美术教培机构',
        watermarkText: '美术教培 · 作品水印',
      },
    });
  }

  async updateSettings(dto: UpdateSettingDto) {
    await this.getSettings();
    return this.prisma.orgSetting.update({
      where: { id: 'default' },
      data: {
        orgName: dto.orgName,
        watermarkText: dto.watermarkText,
        logoUrl: dto.logoUrl,
      },
    });
  }

  async uploadLogo(file: Express.Multer.File) {
    const stored = await this.storage.putObject(
      `branding/logo-${Date.now()}-${file.originalname}`,
      file.buffer,
      file.mimetype || 'image/png',
    );
    return this.prisma.orgSetting.update({
      where: { id: 'default' },
      data: { logoUrl: stored.url },
    });
  }

  listTemplates() {
    return this.prisma.posterTemplate.findMany({ orderBy: { key: 'asc' } });
  }

  updateTemplate(id: string, dto: UpdateTemplateDto) {
    return this.prisma.posterTemplate.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        enabled: dto.enabled,
        metadata: dto.metadata as object | undefined,
      },
    });
  }
}
