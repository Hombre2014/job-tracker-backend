import { IsArray, IsInt, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

class Sort {
  @IsString()
  by: string;

  @IsString()
  dir: 'asc' | 'desc';
}

export class Pagination {
  @IsArray()
  @ValidateNested()
  @Type(() => Sort)
  sort: Sort[];

  @IsInt()
  @Transform(({ value }) => parseInt(value, 10))
  page: number;

  @IsInt()
  @Transform(({ value }) => parseInt(value, 10))
  take: number;

  @IsOptional()
  @IsObject()
  filter?: any;
}
