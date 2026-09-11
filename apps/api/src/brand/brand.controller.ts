import {
  Body,
  Controller,
  Get,
  Put,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators';
import { UpdateBrandDto } from '../common/dto';
import { Errors } from '../common/errors';
import { imageUploadOptions } from '../common/upload';
import { BrandService } from './brand.service';

@Controller()
export class BrandController {
  constructor(private readonly brand: BrandService) {}

  @Get('admin/brand')
  @Roles(Role.admin)
  getAdminBrand() {
    return this.brand.getBrand();
  }

  @Put('admin/brand')
  @Roles(Role.admin)
  updateBrand(@Body() dto: UpdateBrandDto) {
    return this.brand.updateBrand(dto);
  }

  @Post('admin/brand/logo')
  @Roles(Role.admin)
  @UseInterceptors(FileInterceptor('file', imageUploadOptions()))
  uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw Errors.validation('请上传 LOGO 图片');
    }
    return this.brand.uploadLogo(file);
  }

  @Get('brand')
  getBrand() {
    return this.brand.getBrand();
  }
}
