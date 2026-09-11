import { Module } from '@nestjs/common';
import { BrandModule } from '../brand/brand.module';
import { PosterService } from '../posters/poster.service';
import { ArtworksController } from './artworks.controller';
import { ArtworksService } from './artworks.service';

@Module({
  imports: [BrandModule],
  controllers: [ArtworksController],
  providers: [ArtworksService, PosterService],
  exports: [ArtworksService],
})
export class ArtworksModule {}
