import { Injectable } from '@nestjs/common';
import { Client, Storage } from 'node-appwrite';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';

const APPWRITE_PROJECT_ID = 'APPWRITE_PROJECT_ID';
const APPWRITE_BUCKET_ID = 'APPWRITE_BUCKET_ID';

@Injectable()
export class AppwriteUploadsService {
  private client: Client;
  private storage: Storage;
  private projectId: string;
  private bucketId: string;

  constructor(private readonly configService: ConfigService) {
    this.projectId = this.configService.get(APPWRITE_PROJECT_ID);
    this.bucketId = this.configService.get(APPWRITE_BUCKET_ID);
    this.client = new Client();
    this.client.setProject(this.projectId);

    this.storage = new Storage(this.client);
  }

  async uploadFile(file: Express.Multer.File) {
    try {
      const fileBuffer = await fs.promises.readFile(file.path);
      const { $id: fileId, name: fileName } = await this.storage.createFile(
        this.bucketId,
        'unique()',
        new File([fileBuffer], file.originalname, { type: file.mimetype }),
      );

      console.log('File uploaded successfully:', fileName);

      const url = `${this.client.config.endpoint}/storage/buckets/${this.bucketId}/files/${fileId}/view?project=${this.projectId}&mode=admin`;

      return { url };
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    }
  }
}
