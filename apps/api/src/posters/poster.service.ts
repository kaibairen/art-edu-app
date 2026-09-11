import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Artwork } from '@prisma/client';
import { readFile } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import {
  PosterRecipe,
  TEMPLATE_STYLES,
  buildPosterSvg,
  isPosterTemplateKey,
} from './poster-templates';

@Injectable()
export class PosterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly config: ConfigService,
  ) {}

  async generate(artwork: Artwork, templateKey: string) {
    if (!isPosterTemplateKey(templateKey)) {
      throw new BadRequestException('未知海报模板');
    }
    const [student, settings, template] = await Promise.all([
      this.prisma.student.findUniqueOrThrow({
        where: { id: artwork.studentId },
      }),
      this.prisma.orgSetting.findUnique({ where: { id: 'default' } }),
      this.prisma.posterTemplate.findUnique({ where: { key: templateKey } }),
    ]);
    if (template && !template.enabled) {
      throw new BadRequestException('该海报模板已停用');
    }

    const createdOn = artwork.createdOn.toISOString().slice(0, 10);
    const watermarkText = settings?.watermarkText ?? '美术教培 · 作品水印';
    const style = TEMPLATE_STYLES[templateKey];
    const recipe: PosterRecipe = {
      templateKey,
      studentName: student.name,
      createdOn,
      theme: artwork.theme,
      watermarkText,
      logoUrl: settings?.logoUrl ?? null,
      logoEmbedded: true,
      overlays: ['name', 'createdOn', 'logo', 'watermark'],
      background: style.background,
      accent: style.accent,
      frame: style.frame,
    };

    const artworkBuf = await this.loadImageBuffer(artwork.imageUrl);
    const artworkPng = await sharp(artworkBuf).png().toBuffer();
    const artworkDataUri = `data:image/png;base64,${artworkPng.toString('base64')}`;

    let logoDataUri: string | null = null;
    if (settings?.logoUrl) {
      try {
        const logoBuf = await this.loadImageBuffer(settings.logoUrl);
        const logoPng = await sharp(logoBuf).resize(192, 192).png().toBuffer();
        logoDataUri = `data:image/png;base64,${logoPng.toString('base64')}`;
      } catch {
        logoDataUri = null;
      }
    }
    if (!logoDataUri) {
      logoDataUri = await this.defaultLogoDataUri(style.frame);
    }

    const svg = buildPosterSvg({ artworkDataUri, logoDataUri, recipe });
    const posterPng = await sharp(Buffer.from(svg)).png().toBuffer();
    const stored = await this.storage.putObject(
      `posters/${artwork.id}/${templateKey}-${Date.now()}.png`,
      posterPng,
      'image/png',
    );

    return this.prisma.poster.create({
      data: {
        artworkId: artwork.id,
        templateKey,
        imageUrl: stored.url,
        recipe: recipe as object,
      },
    });
  }

  private async loadImageBuffer(url: string): Promise<Buffer> {
    if (url.startsWith('data:')) {
      const base64 = url.split(',')[1] ?? '';
      return Buffer.from(base64, 'base64');
    }
    const marker = '/files/';
    const idx = url.indexOf(marker);
    if (idx >= 0) {
      const key = decodeURIComponent(url.slice(idx + marker.length));
      const root = this.config.get<string>('STORAGE_LOCAL_DIR', './storage');
      return readFile(join(root, key));
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const res = await fetch(url);
      if (!res.ok) {
        throw new BadRequestException('无法读取作品图片');
      }
      return Buffer.from(await res.arrayBuffer());
    }
    throw new BadRequestException('不支持的图片地址');
  }

  private async defaultLogoDataUri(color: string): Promise<string> {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192">
      <rect width="192" height="192" rx="32" fill="${color}"/>
      <text x="96" y="112" text-anchor="middle" fill="#ffffff" font-size="42" font-family="sans-serif">LOGO</text>
    </svg>`;
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    return `data:image/png;base64,${png.toString('base64')}`;
  }
}
