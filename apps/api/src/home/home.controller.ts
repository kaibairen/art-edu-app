import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators';
import { HomeContentDto } from '../common/dto';
import { HomeService } from './home.service';

@Controller('admin/home-contents')
@Roles(Role.admin)
export class HomeController {
  constructor(private readonly home: HomeService) {}

  @Get()
  list() {
    return this.home.listAll();
  }

  @Post()
  create(@Body() dto: HomeContentDto) {
    return this.home.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: HomeContentDto) {
    return this.home.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.home.remove(id);
  }
}
