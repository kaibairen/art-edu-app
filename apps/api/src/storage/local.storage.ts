import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { ObjectStorage, StoredObject } from './storage.types';

@Injectable()
export class LocalStorage implements ObjectStorage {
  constructor(private readonly config: ConfigService) {}

  async putObject(
    key: string,
    body: Buffer,
    _contentType: string,
  ): Promise<StoredObject> {
    const root = this.config.get<string>('STORAGE_LOCAL_DIR', './storage');
    const full = join(root, key);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, body);
    const base = this.config
      .get<string>('STORAGE_PUBLIC_BASE_URL', 'http://localhost:3000/files')
      .replace(/\/$/, '');
    return { key, url: `${base}/${key}` };
  }
}
