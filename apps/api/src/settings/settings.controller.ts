import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { memoryStorage } from 'multer';
import { Roles } from '../common/decorators';
import { UpdateSettingDto, UpdateTemplateDto } from '../common/dto';
import { SettingsService } from './settings.service';

@Controller('admin')
@Roles(Role.admin)
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('settings')
  getSettings() {
    return this.settings.getSettings();
  }

  @Patch('settings')
  updateSettings(@Body() dto: UpdateSettingDto) {
    return this.settings.updateSettings(dto);
  }

  @Post('settings/logo')
  @UseInterceptors(FileInterceptor('logo', { storage: memoryStorage() }))
  uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请上传 LOGO 图片');
    }
    return this.settings.uploadLogo(file);
  }

  @Get('poster-templates')
  listTemplates() {
    return this.settings.listTemplates();
  }

  @Patch('poster-templates/:id')
  updateTemplate(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.settings.updateTemplate(id, dto);
  }
}
