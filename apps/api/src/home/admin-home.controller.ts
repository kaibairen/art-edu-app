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
import {
  CreateCarouselDto,
  CreateCourseDto,
  CreateFeaturedArtworkDto,
  UpdateCarouselDto,
  UpdateCourseDto,
  UpdateFeaturedArtworkDto,
} from './home.dto';
import { HomeService } from './home.service';

@Controller('admin/home')
@Roles(Role.admin)
export class AdminHomeController {
  constructor(private readonly home: HomeService) {}

  @Get('carousels')
  listCarousels() {
    return this.home.listCarousels();
  }

  @Post('carousels')
  createCarousel(@Body() dto: CreateCarouselDto) {
    return this.home.createCarousel(dto);
  }

  @Get('carousels/:id')
  getCarousel(@Param('id') id: string) {
    return this.home.getCarousel(id);
  }

  @Patch('carousels/:id')
  updateCarousel(@Param('id') id: string, @Body() dto: UpdateCarouselDto) {
    return this.home.updateCarousel(id, dto);
  }

  @Delete('carousels/:id')
  removeCarousel(@Param('id') id: string) {
    return this.home.removeCarousel(id);
  }

  @Get('featured-artworks')
  listFeaturedArtworks() {
    return this.home.listFeaturedArtworks();
  }

  @Post('featured-artworks')
  createFeaturedArtwork(@Body() dto: CreateFeaturedArtworkDto) {
    return this.home.createFeaturedArtwork(dto);
  }

  @Get('featured-artworks/:id')
  getFeaturedArtwork(@Param('id') id: string) {
    return this.home.getFeaturedArtwork(id);
  }

  @Patch('featured-artworks/:id')
  updateFeaturedArtwork(
    @Param('id') id: string,
    @Body() dto: UpdateFeaturedArtworkDto,
  ) {
    return this.home.updateFeaturedArtwork(id, dto);
  }

  @Delete('featured-artworks/:id')
  removeFeaturedArtwork(@Param('id') id: string) {
    return this.home.removeFeaturedArtwork(id);
  }

  @Get('courses')
  listCourses() {
    return this.home.listCourses();
  }

  @Post('courses')
  createCourse(@Body() dto: CreateCourseDto) {
    return this.home.createCourse(dto);
  }

  @Get('courses/:id')
  getCourse(@Param('id') id: string) {
    return this.home.getCourse(id);
  }

  @Patch('courses/:id')
  updateCourse(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.home.updateCourse(id, dto);
  }

  @Delete('courses/:id')
  removeCourse(@Param('id') id: string) {
    return this.home.removeCourse(id);
  }
}
