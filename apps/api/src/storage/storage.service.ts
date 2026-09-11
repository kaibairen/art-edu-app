import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocalStorage } from './local.storage';
import { S3Storage } from './s3.storage';
import { ObjectStorage, StoredObject } from './storage.types';

@Injectable()
export class StorageService implements ObjectStorage {
  private readonly driver: ObjectStorage;

  constructor(config: ConfigService, local: LocalStorage, s3: S3Storage) {
    const name = config.get<string>('STORAGE_DRIVER', 'local');
    this.driver = name === 's3' ? s3 : local;
  }

  putObject(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<StoredObject> {
    return this.driver.putObject(key, body, contentType);
  }
}
