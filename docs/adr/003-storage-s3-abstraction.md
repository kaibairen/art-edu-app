# ADR 003：S3 兼容对象存储抽象

- 状态：已采纳
- 日期：2026-09-11

## 决策

`StorageService` 统一 `putObject`。`STORAGE_DRIVER=local` 写入本地目录并由 `/files` 静态托管；`s3` 走 AWS SDK v3，可对接 MinIO。

## 来源

- AWS SDK v3 S3 Client：<https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/>
- MinIO 驱动与 path-style：<https://min.io/docs/minio/linux/developers/minio-drivers.html>
- Stack Overflow 上关于 MinIO `forcePathStyle` 的常见配置：<https://stackoverflow.com/questions/67553012/aws-sdk-js-v3-s3-and-minio>

## 后果

本地开发无需 MinIO。生产只需改 endpoint / bucket / 密钥，业务代码不感知驱动。
