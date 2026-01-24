import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import archiver = require('archiver');
import * as XLSX from 'xlsx';
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
import FormData = require('form-data');
import * as unzipper from 'unzipper';
import { Prisma } from '../generated/prisma/client';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir = path.join(process.cwd(), 'backups');

  constructor(private readonly prisma: PrismaService) {
    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyBackup() {
    this.logger.log('Starting daily backup process...');

    const telegramChatId = process.env.TELEGRAM_CHAT_ID;
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!telegramChatId || !telegramBotToken) {
      const errorMsg =
        'Telegram credentials not found in environment variables. Backup skipped.';
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const tempDir = path.join(os.tmpdir(), `backup-${timestamp}`);

    try {
      // 1. Create temp directory for raw files
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
      }

      const dumpFileName = `db-dump-${timestamp}.sql`;
      const dumpFilePath = path.join(tempDir, dumpFileName);

      const excelFileName = `data-export-${timestamp}.xlsx`;
      const excelFilePath = path.join(tempDir, excelFileName);

      const zipFileName = `backup-${timestamp}.zip`;
      // Save zip to persistent backup directory
      const zipFilePath = path.join(this.backupDir, zipFileName);

      // 2. Perform Database Dump
      this.logger.log('Creating database dump...');
      await this.createDatabaseDump(dumpFilePath);

      // 3. Export Data to Excel
      this.logger.log('Exporting data to Excel...');
      await this.createExcelExport(excelFilePath);

      // 4. Create Zip Archive (zipped to persistent location)
      this.logger.log(`Creating zip archive at ${zipFilePath}...`);
      await this.createZipArchive(zipFilePath, [dumpFilePath, excelFilePath]);

      // 5. Send to Telegram
      this.logger.log('Sending backup to Telegram...');
      await this.sendToTelegram(zipFilePath, telegramChatId, telegramBotToken);

      this.logger.log('Backup completed successfully.');
    } catch (error) {
      this.logger.error(`Backup failed: ${error.message}`, error.stack);
      throw error;
    } finally {
      // 6. Cleanup temp directory (raw files)
      try {
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
      } catch (cleanupError) {
        this.logger.error(
          `Failed to clean up temp directory: ${cleanupError.message}`,
        );
      }
    }
  }

  async getBackups() {
    try {
      const files = fs.readdirSync(this.backupDir);
      const backups = files
        .filter((file) => file.endsWith('.zip'))
        .map((file) => {
          const stats = fs.statSync(path.join(this.backupDir, file));
          return {
            filename: file,
            size: stats.size,
            createdAt: stats.birthtime,
          };
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return backups;
    } catch (error) {
      this.logger.error(`Failed to list backups: ${error.message}`);
      return [];
    }
  }

  getBackupPath(filename: string): string {
    // Prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(this.backupDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      throw new Error('Backup file not found');
    }
    return filePath;
  }

  private async createDatabaseDump(outputPath: string): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not defined');
    }

    // Sanitize the URL for pg_dump: remove query parameters (e.g., ?schema=public)
    // pg_dump might fail if unknown parameters are passed in the connection string.
    const urlObj = new URL(databaseUrl);
    urlObj.search = ''; // Remove all query params
    const sanitizedUrl = urlObj.toString();

    // Command to dump the specific database
    // Note: We don't use --clean here because the restore process drops and recreates the schema
    const command = `pg_dump "${sanitizedUrl}" -F p -f "${outputPath}"`;

    try {
      await execAsync(command);
    } catch (error) {
      throw new Error(`pg_dump failed: ${error.message}`);
    }
  }

  private async createExcelExport(outputPath: string): Promise<void> {
    const workbook = XLSX.utils.book_new();

    // Dynamically get all model names from Prisma
    let models: string[] = [];
    // @ts-ignore - Check if Prisma.dmmf is available
    if (Prisma.dmmf && Prisma.dmmf.datamodel) {
      // @ts-ignore
      models = Prisma.dmmf.datamodel.models.map((model) => {
        return model.name.charAt(0).toLowerCase() + model.name.slice(1);
      });
    } else if (Prisma.ModelName) {
      // Fallback to ModelName constant if available
      models = Object.keys(Prisma.ModelName).map((name) => {
        return name.charAt(0).toLowerCase() + name.slice(1);
      });
    } else {
      this.logger.warn(
        'Could not detect Prisma models dynamically. Excel export might be empty.',
      );
    }

    for (const model of models) {
      // @ts-ignore - Dynamic access to prisma models
      const data = await this.prisma[model].findMany();
      if (data && data.length > 0) {
        // Flatten objects if needed, but for raw backup JSON stringify might be better for complex fields
        // For verify sake, we just dump the data as is.
        // Convert dates to strings to avoid Excel issues if needed, but xlsx handles dates.
        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, model);
      }
    }

    XLSX.writeFile(workbook, outputPath);
  }

  private async createZipArchive(
    outputPath: string,
    filesToZip: string[],
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Sets the compression level.
      });

      output.on('close', () => {
        resolve();
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);

      for (const file of filesToZip) {
        archive.file(file, { name: path.basename(file) });
      }

      archive.finalize();
    });
  }

  private async sendToTelegram(
    filePath: string,
    chatId: string,
    token: string,
  ): Promise<void> {
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('caption', `Daily Backup - ${new Date().toISOString()}`);
    formData.append('document', fs.createReadStream(filePath));

    try {
      await axios.post(
        `https://api.telegram.org/bot${token}/sendDocument`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        },
      );
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        this.logger.error(
          `Telegram upload failed: ${error.message} - Status: ${error.response.status} - Data: ${JSON.stringify(error.response.data)}`,
        );
      } else {
        this.logger.error(`Telegram upload failed: ${error.message}`);
      }
      throw error; // Re-throw to ensure the process knows it failed
    }
  }
  async restoreBackup(file: Express.Multer.File): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const tempDir = path.join(os.tmpdir(), `restore-${timestamp}`);

    try {
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
      }

      const zipFilePath = path.join(tempDir, file.originalname);
      fs.writeFileSync(zipFilePath, file.buffer);

      // Extract zip
      await fs
        .createReadStream(zipFilePath)
        .pipe(unzipper.Extract({ path: tempDir }))
        .promise();

      // Find sql dump file
      const files = fs.readdirSync(tempDir);
      const sqlFile = files.find((f) => f.endsWith('.sql'));

      if (!sqlFile) {
        throw new Error('No SQL dump file found in the backup archive');
      }

      const dumpFilePath = path.join(tempDir, sqlFile);
      this.logger.log(`Restoring database from ${dumpFilePath}...`);

      await this.restoreDatabaseFromDump(dumpFilePath);

      this.logger.log('Database restore completed successfully.');
    } catch (error) {
      this.logger.error(`Restore failed: ${error.message}`, error.stack);
      throw error;
    } finally {
      // Cleanup
      try {
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
      } catch (cleanupError) {
        this.logger.error(
          `Failed to clean up temp directory: ${cleanupError.message}`,
        );
      }
    }
  }

  private async restoreDatabaseFromDump(dumpFilePath: string): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not defined');
    }

    const urlObj = new URL(databaseUrl);
    urlObj.search = '';
    const sanitizedUrl = urlObj.toString();

    try {
      // Step 1: Drop and recreate the public schema to ensure a clean slate
      // This avoids foreign key constraint issues during restore
      this.logger.log('Dropping and recreating public schema...');
      const dropSchemaCommand = `psql "${sanitizedUrl}" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;"`;
      await execAsync(dropSchemaCommand);

      // Step 2: Restore from the dump file
      // Using --set ON_ERROR_STOP=1 to stop on first error for better debugging
      this.logger.log('Restoring data from dump file...');
      const restoreCommand = `psql "${sanitizedUrl}" --set ON_ERROR_STOP=1 -f "${dumpFilePath}"`;
      const { stdout, stderr } = await execAsync(restoreCommand);

      if (stderr) {
        this.logger.warn(`psql stderr output: ${stderr}`);
      }
      if (stdout) {
        this.logger.log(`psql completed: ${stdout.slice(0, 200)}...`);
      }
    } catch (error) {
      this.logger.error(`Restore command output: ${error.stdout || ''}`);
      this.logger.error(`Restore command stderr: ${error.stderr || ''}`);
      throw new Error(`psql restore failed: ${error.message}`);
    }
  }
}
