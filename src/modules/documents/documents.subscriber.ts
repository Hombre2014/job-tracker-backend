import { DataSource, EntitySubscriberInterface, EventSubscriber, RemoveEvent } from 'typeorm';
import { Document } from './entities/document.entity';
import { Injectable } from '@nestjs/common';
import { AppwriteUploadsService } from '../appwrite-uploads/appwrite-uploads.service';

@EventSubscriber()
@Injectable()
export class DocumentsSubscriber implements EntitySubscriberInterface<Document> {
  constructor(
    ds: DataSource,
    private readonly appwriteUploadsService: AppwriteUploadsService,
  ) {
    ds.subscribers.push(this);
  }

  listenTo() {
    return Document;
  }

  async beforeRemove(event: RemoveEvent<Document>) {
    await this.appwriteUploadsService.deleteFileByUrl(event.entity.url);
  }
}
