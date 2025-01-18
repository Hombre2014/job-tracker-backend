import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { DocumentCategory } from '../document-category.enum';

export class CreateDocumentDto {
  @IsString()
  title: string;

  @IsEnum(DocumentCategory)
  category: DocumentCategory;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  boardId: string;
}
