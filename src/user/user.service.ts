import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EditUserDto } from './dto';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async editUser(userId: number, dto: EditUserDto) {
    let oldProfilePicture: string | null = null;
    let newProfilePicturePath: string | null = null;
    let fileName: string | null = null;

    // If profilePicture is being updated, handle file movement
    if (dto.profilePicture) {
      // Extract filename from URL
      // e.g., "http://localhost:3000/uploads-temp/1_1770200204113.png" -> "1_1770200204113.png"
      fileName = path.basename(dto.profilePicture);

      const tempPath = path.join(process.cwd(), 'uploads-temp', fileName);
      const permanentPath = path.join(process.cwd(), 'upload', fileName);

      try {
        // Check if temp file exists
        await fs.access(tempPath);

        // Get old profile picture before updating
        const currentUser = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { profilePicture: true },
        });
        oldProfilePicture = currentUser?.profilePicture;

        // Copy file from temp to permanent location
        await fs.copyFile(tempPath, permanentPath);
        newProfilePicturePath = permanentPath;
      } catch (error) {
        throw new Error(`Failed to move profile picture: ${error.message}`);
      }
    }

    try {
      // Update user in database
      const user = await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          ...dto,
        },
      });

      // If update successful and file was moved, delete temp file
      if (fileName && newProfilePicturePath) {
        const tempPath = path.join(process.cwd(), 'uploads-temp', fileName);

        try {
          await fs.unlink(tempPath);
        } catch (error) {
          console.error('Failed to delete temp file:', error);
          // Don't throw here as the main operation succeeded
        }

        // Delete old profile picture if it exists and is different
        if (oldProfilePicture && oldProfilePicture !== dto.profilePicture) {
          const oldFileName = path.basename(oldProfilePicture);
          const oldPath = path.join(process.cwd(), 'upload', oldFileName);

          try {
            await fs.unlink(oldPath);
          } catch (error) {
            console.error('Failed to delete old profile picture:', error);
            // Don't throw here as the main operation succeeded
          }
        }
      }

      delete user.hash;

      return user;
    } catch (error) {
      // If database update failed, clean up the copied file
      if (newProfilePicturePath) {
        try {
          await fs.unlink(newProfilePicturePath);
        } catch (cleanupError) {
          console.error('Failed to cleanup copied file:', cleanupError);
        }
      }
      throw error;
    }
  }
}
