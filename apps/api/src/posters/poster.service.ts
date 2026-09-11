import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Artwork } from '@prisma/client';
import { readFile } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { Errors } from '../common/errors';
import { BrandService } from '../brand/brand.service';
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
    private readonly brand: BrandService,
  ) {}

  async generate(
    artwork: Artwork,
    templateKey: string,
    mode: 'preview' | 'download',
  ) {
    if (!isPosterTemplateKey(templateKey)) {
      throw Errors.validation('未知海报模板');
    }
    const [student, brand] = await Promise.all([
      this.prisma.student.findUnique({ where: { id: artwork.studentId } }),
      this.brand.getBrand(),
    ]);
    if (!student) {
      throw Errors.cannotView();
    }
    const template = brand.templates.find((t) => t.key === templateKey);
    if (template && !template.enabled) {
      throw Errors.validation('该海报模板已停用');
    }
    if (!this.brand.isLogoConfigured(brand.logoUrl)) {
      throw Errors.logoNotConfigured();
    }

    const createdAt = artwork.createdAt.toISOString();
    const watermarkText = brand.watermarkText ?? '';
    const style = TEMPLATE_STYLES[templateKey];
    const recipe: PosterRecipe = {
      templateKey,
      studentName: student.name,
      createdAt,
      title: artwork.title ?? artwork.courseTheme ?? style.title,
      watermarkText,
      watermarkOpacity: brand.watermarkOpacity,
      watermarkPosition: brand.watermarkPosition,
      logoUrl: brand.logoUrl as string,
      logoEmbedded: true,
      overlays: ['name', 'createdAt', 'logo', 'watermark'],
      background: style.background,
      accent: style.accent,
      frame: style.frame,
    };

    const artworkBuf = await this.loadImageBuffer(artwork.imageUrl);
    const artworkPng = await sharp(artworkBuf).png().toBuffer();
    const artworkDataUri = `data:image/png;base64,${artworkPng.toString('base64')}`;

    let logoDataUri: string;
    try {
      const logoBuf = await this.loadImageBuffer(brand.logoUrl as string);
      const logoPng = await sharp(logoBuf).resize(192, 192).png().toBuffer();
      logoDataUri = `data:image/png;base64,${logoPng.toString('base64')}`;
    } catch {
      throw Errors.logoNotConfigured();
    }

    const svg = buildPosterSvg({
      artworkDataUri,
      logoDataUri,
      recipe,
      previewBadge: mode === 'preview',
    });
    const width = mode === 'preview' ? 540 : 1080;
    const height = mode === 'preview' ? 810 : 1620;
    const posterPng = await sharp(Buffer.from(svg))
      .resize(width, height)
      .png()
      .toBuffer();
    const folder = mode === 'preview' ? 'previews' : 'downloads';
    const stored = await this.storage.putObject(
      `posters/${folder}/${artwork.id}/${templateKey}-${Date.now()}.png`,
      posterPng,
      'image/png',
    );

    if (mode === 'download') {
      await this.prisma.poster.create({
        data: {
          artworkId: artwork.id,
          templateKey,
          imageUrl: stored.url,
          recipe: recipe as object,
        },
      });
      return { downloadUrl: stored.url, templateKey };
    }

    return { previewUrl: stored.url, templateKey };
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
        throw Errors.validation('无法读取作品图片');
      }
      return Buffer.from(await res.arrayBuffer());
    }
    throw Errors.validation('不支持的图片地址');
  }
}
