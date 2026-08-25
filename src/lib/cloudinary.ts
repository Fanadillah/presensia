import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  public_id: string;
  secure_url: string;
  format: string;
  bytes: number;
  width: number;
  height: number;
}

export async function uploadPhoto(
  file: Buffer,
  folder: string = 'attendance'
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        // File sudah dikompres server (720p, q70 mozjpeg) — simpan apa adanya.
        // Tambah eager limit untuk jaga bila ada upload tanpa watermark.
        format: 'jpg',
        quality: 'auto:low',
        fetch_format: 'auto',
        eager: [{ width: 720, crop: 'limit', quality: 'auto:low', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result as UploadResult);
      }
    );
    uploadStream.end(file);
  });
}

export async function deletePhoto(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export async function deletePhotosByFolder(
  folder: string = 'attendance',
  olderThanDays: number = 3
): Promise<number> {
  let totalDeleted = 0;
  let nextCursor: string | undefined;

  do {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: `${folder}/`,
      max_results: 100,
      next_cursor: nextCursor,
    });

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    for (const resource of result.resources) {
      const createdAt = new Date(resource.created_at);
      if (createdAt < cutoffDate) {
        try {
          await cloudinary.uploader.destroy(resource.public_id);
          totalDeleted++;
        } catch (err) {
          console.error(`Failed to delete ${resource.public_id}:`, err);
        }
      }
    }

    nextCursor = result.next_cursor;
  } while (nextCursor);

  return totalDeleted;
}

export function getOptimizedUrl(
  publicId: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
  }
): string {
  return cloudinary.url(publicId, {
    transformation: {
      width: options?.width || 400,
      height: options?.height || 400,
      crop: 'limit',
      quality: options?.quality || 'auto',
      fetch_format: 'auto',
    },
  });
}

export default cloudinary;
