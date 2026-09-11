import { memoryStorage } from 'multer';
import { Errors } from './errors';

export const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function imageUploadOptions() {
  return {
    storage: memoryStorage(),
    limits: { fileSize: IMAGE_MAX_BYTES },
    fileFilter: (
      _req: unknown,
      file: { mimetype: string },
      cb: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      if (!ALLOWED_MIME.has(file.mimetype)) {
        cb(Errors.unsupportedMedia(), false);
        return;
      }
      cb(null, true);
    },
  };
}
