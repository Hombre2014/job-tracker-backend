import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DocumentCategory } from '../document-category.enum';

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(DocumentCategory)
  category?: DocumentCategory;

  @IsOptional()
  @IsString()
  description?: string;
}
