//

// image-upload.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';

@Injectable()
export class ImageUploadService {
  private readonly uploadDir = './uploads-temp';
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ];
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB

  constructor() {
    this.ensureUploadDirExists();
  }

  private async ensureUploadDirExists() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async uploadImage(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ url: string }> {
    // Validate file type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    // Validate file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File too large. Maximum size: ${this.maxFileSize / (1024 * 1024)}MB`,
      );
    }

    // Generate unique filename with timestamp
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    const filename = `${userId}_${timestamp}${ext}`;
    const filepath = path.join(this.uploadDir, filename);

    try {
      // Save file to disk
      await fs.writeFile(filepath, file.buffer);

      // Return URL that can be opened in browser
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      const url = `${baseUrl}/uploads-temp/${filename}`;

      return { url };
    } catch (error) {
      throw new BadRequestException(`Failed to save image: ${error.message}`);
    }
  }
}
