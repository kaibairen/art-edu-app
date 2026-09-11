import { Global, Module } from '@nestjs/common';
import { LocalStorage } from './local.storage';
import { S3Storage } from './s3.storage';
import { StorageService } from './storage.service';

@Global()
@Module({
  providers: [LocalStorage, S3Storage, StorageService],
  exports: [StorageService],
})
export class StorageModule {}
