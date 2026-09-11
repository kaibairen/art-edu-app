import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ObjectStorage, StoredObject } from './storage.types';

/**
 * S3 / MinIO 兼容实现。
 * 官方 SDK：https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/
 * MinIO path-style：https://min.io/docs/minio/linux/developers/minio-drivers.html
 */
@Injectable()
export class S3Storage implements ObjectStorage {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(config: ConfigService) {
    const endpoint = config.get<string>('S3_ENDPOINT');
    this.bucket = config.get<string>('S3_BUCKET', 'art-edu');
    this.publicUrl = (
      config.get<string>('S3_PUBLIC_URL') ?? `${endpoint}/${this.bucket}`
    ).replace(/\/$/, '');
    this.client = new S3Client({
      region: config.get<string>('S3_REGION', 'us-east-1'),
      endpoint,
      forcePathStyle: config.get<string>('S3_FORCE_PATH_STYLE', 'true') === 'true',
      credentials: {
        accessKeyId: config.get<string>('S3_ACCESS_KEY', ''),
        secretAccessKey: config.get<string>('S3_SECRET_KEY', ''),
      },
    });
  }

  async putObject(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<StoredObject> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    return { key, url: `${this.publicUrl}/${key}` };
  }
}
