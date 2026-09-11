import { Module } from '@nestjs/common';
import { PosterService } from '../posters/poster.service';
import { ArtworksController } from './artworks.controller';
import { ArtworksService } from './artworks.service';

@Module({
  controllers: [ArtworksController],
  providers: [ArtworksService, PosterService],
  exports: [ArtworksService],
})
export class ArtworksModule {}
