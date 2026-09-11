import { Injectable } from '@nestjs/common';
import {
  BrandConfigDto,
  POSTER_TEMPLATE_KEYS,
  PosterTemplateKey,
} from '@art-edu/shared';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { UpdateBrandDto } from '../common/dto';
import { Errors } from '../common/errors';

const DEFAULT_TEMPLATES: Array<{
  id: PosterTemplateKey;
  key: PosterTemplateKey;
  name: string;
  description: string;
}> = [
  { id: 'simple', key: 'simple', name: '简约', description: '干净留白，突出作品。' },
  { id: 'frame', key: 'frame', name: '画框', description: '画框陈列风格。' },
  { id: 'magazine', key: 'magazine', name: '杂志', description: '杂志封面排版。' },
];

@Injectable()
export class BrandService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async getBrand(): Promise<BrandConfigDto> {
    const [setting, templates] = await Promise.all([
      this.ensureSetting(),
      this.ensureTemplates(),
    ]);
    return this.toDto(setting, templates);
  }

  async updateBrand(dto: UpdateBrandDto): Promise<BrandConfigDto> {
    await this.ensureSetting();
    await this.ensureTemplates();
    if (dto.templates) {
      for (const patch of dto.templates) {
        await this.prisma.posterTemplate.update({
          where: { id: patch.id },
          data: {
            enabled: patch.enabled,
            name: patch.name,
          },
        });
      }
    }
    const enabledCount = await this.prisma.posterTemplate.count({
      where: { enabled: true },
    });
    if (enabledCount < 1) {
      throw Errors.validation('至少需要启用一套海报模板');
    }
    await this.prisma.orgSetting.update({
      where: { id: 'default' },
      data: {
        orgName: dto.orgName,
        watermarkText: dto.watermarkText,
        watermarkOpacity: dto.watermarkOpacity,
        watermarkPosition: dto.watermarkPosition,
      },
    });
    return this.getBrand();
  }

  async uploadLogo(file: Express.Multer.File): Promise<BrandConfigDto> {
    await this.ensureSetting();
    const stored = await this.storage.putObject(
      `branding/logo-${Date.now()}-${file.originalname}`,
      file.buffer,
      file.mimetype || 'image/png',
    );
    await this.prisma.orgSetting.update({
      where: { id: 'default' },
      data: { logoUrl: stored.url },
    });
    return this.getBrand();
  }

  isLogoConfigured(logoUrl?: string | null): boolean {
    return Boolean(logoUrl && logoUrl.trim());
  }

  private async ensureSetting() {
    return this.prisma.orgSetting.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        orgName: '美术教培机构',
        watermarkText: '美术教培 · 作品水印',
        watermarkOpacity: 0.2,
        watermarkPosition: 'bottomRight',
      },
    });
  }

  private async ensureTemplates() {
    for (const tpl of DEFAULT_TEMPLATES) {
      await this.prisma.posterTemplate.upsert({
        where: { key: tpl.key },
        update: {},
        create: {
          id: tpl.id,
          key: tpl.key,
          name: tpl.name,
          description: tpl.description,
          enabled: true,
          metadata: {},
        },
      });
    }
    return this.prisma.posterTemplate.findMany({
      where: { key: { in: [...POSTER_TEMPLATE_KEYS] } },
      orderBy: { key: 'asc' },
    });
  }

  private toDto(
    setting: {
      orgName: string | null;
      logoUrl: string | null;
      watermarkText: string | null;
      watermarkOpacity: number;
      watermarkPosition: BrandConfigDto['watermarkPosition'];
    },
    templates: Array<{
      id: string;
      key: string;
      name: string;
      enabled: boolean;
      previewUrl: string | null;
    }>,
  ): BrandConfigDto {
    return {
      orgName: setting.orgName,
      logoUrl: setting.logoUrl && setting.logoUrl.trim() ? setting.logoUrl : null,
      watermarkText: setting.watermarkText,
      watermarkOpacity: setting.watermarkOpacity,
      watermarkPosition: setting.watermarkPosition,
      templates: templates.map((t) => ({
        id: t.id,
        key: t.key as PosterTemplateKey,
        enabled: t.enabled,
        previewUrl: t.previewUrl,
        name: t.name,
      })),
    };
  }
}
