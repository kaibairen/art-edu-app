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
  CreateBannerDto,
  CreateCourseDto,
  CreateFeaturedArtworkDto,
  CreateFeaturedFromArtworksDto,
  ReorderHomeItemsDto,
  UpdateBannerDto,
  UpdateBannerStatusDto,
  UpdateCourseDto,
  UpdateFeaturedArtworkDto,
  UpdatePublishStatusDto,
} from './home.dto';
import { HomeService } from './home.service';

@Controller('admin/home')
@Roles(Role.admin)
export class AdminHomeController {
  constructor(private readonly home: HomeService) {}

  @Get('banners')
  listBanners() {
    return this.home.listBanners();
  }

  @Post('banners')
  createBanner(@Body() dto: CreateBannerDto) {
    return this.home.createBanner(dto);
  }

  @Patch('banners/reorder')
  reorderBanners(@Body() dto: ReorderHomeItemsDto) {
    return this.home.reorderBanners(dto);
  }

  @Get('banners/:id')
  getBanner(@Param('id') id: string) {
    return this.home.getBanner(id);
  }

  @Patch('banners/:id')
  updateBanner(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
    return this.home.updateBanner(id, dto);
  }

  @Patch('banners/:id/status')
  updateBannerStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBannerStatusDto,
  ) {
    return this.home.updateBannerStatus(id, dto);
  }

  @Delete('banners/:id')
  removeBanner(@Param('id') id: string) {
    return this.home.removeBanner(id);
  }

  @Get('featured-artworks')
  listFeaturedArtworks() {
    return this.home.listFeaturedArtworks();
  }

  @Post('featured-artworks')
  createFeaturedArtwork(@Body() dto: CreateFeaturedArtworkDto) {
    return this.home.createFeaturedArtwork(dto);
  }

  @Post('featured-artworks/from-artworks')
  createFeaturedFromArtworks(@Body() dto: CreateFeaturedFromArtworksDto) {
    return this.home.createFeaturedFromArtworks(dto);
  }

  @Patch('featured-artworks/reorder')
  reorderFeaturedArtworks(@Body() dto: ReorderHomeItemsDto) {
    return this.home.reorderFeaturedArtworks(dto);
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

  @Patch('featured-artworks/:id/status')
  updateFeaturedArtworkStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePublishStatusDto,
  ) {
    return this.home.updateFeaturedArtworkStatus(id, dto);
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

  @Patch('courses/reorder')
  reorderCourses(@Body() dto: ReorderHomeItemsDto) {
    return this.home.reorderCourses(dto);
  }

  @Get('courses/:id')
  getCourse(@Param('id') id: string) {
    return this.home.getCourse(id);
  }

  @Patch('courses/:id')
  updateCourse(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.home.updateCourse(id, dto);
  }

  @Patch('courses/:id/status')
  updateCourseStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePublishStatusDto,
  ) {
    return this.home.updateCourseStatus(id, dto);
  }

  @Delete('courses/:id')
  removeCourse(@Param('id') id: string) {
    return this.home.removeCourse(id);
  }
}
