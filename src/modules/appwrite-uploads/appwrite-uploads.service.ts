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

  constructor(private readonly configService: ConfigService) {
    this.client = new Client();
    this.client.setProject(this.configService.get(APPWRITE_PROJECT_ID));

    this.storage = new Storage(this.client);
  }

  async uploadFile(file: Express.Multer.File) {
    try {
      const bucketId = this.configService.get(APPWRITE_BUCKET_ID); // Replace with your Bucket ID

      const fileBuffer = await fs.promises.readFile(file.path);
      const response = await this.storage.createFile(
        bucketId,
        'unique()',
        new File([fileBuffer], file.originalname, { type: file.mimetype }),
      );
      console.log('File uploaded successfully:', response);
    } catch (error) {
      console.error('Failed to upload file:', error);
    }
  }
}
