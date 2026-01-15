import {
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BackupService } from './backup.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/entities/role.enum';
import { Public } from '../auth/public.decorator';
import { createReadStream } from 'fs';
import type { Response } from 'express';

@Controller('backup')
@Roles(Role.ADMIN)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post('trigger')
  async triggerBackup() {
    try {
      await this.backupService.handleDailyBackup();
      return {
        message: 'Backup process completed and sent to Telegram.',
      };
    } catch (error) {
      return {
        message: `Backup failed: ${error.message}`,
        error: true,
      };
    }
  }

  @Post('restore')
  @Public() // Bypass authentication
  @UseInterceptors(FileInterceptor('file'))
  async restore(
    @UploadedFile() file: Express.Multer.File,
    @Headers('x-backup-restore-key') restoreKey: string,
  ) {
    const envKey = process.env.BACKUP_RESTORE_KEY;
    if (!envKey || restoreKey !== envKey) {
      throw new ForbiddenException('Invalid or missing restore key.');
    }

    if (!file) {
      throw new Error('No file provided');
    }
    await this.backupService.restoreBackup(file);
    return { message: 'Database restored successfully' };
  }

  @Get()
  async findAll() {
    return this.backupService.getBackups();
  }

  @Get(':filename')
  async download(
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const filePath = this.backupService.getBackupPath(filename);
    const file = createReadStream(filePath);

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return new StreamableFile(file);
  }
}
