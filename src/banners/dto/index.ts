import {
    IsString,
    IsOptional,
    IsBoolean,
    IsNumber,
    IsMongoId,
    MinLength,
    MaxLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

// Create Banner DTO
export class CreateBannerDto {
    @IsOptional()
    @IsString()
    image: string;

    // One of these three will be required
    @IsOptional()
    @IsMongoId()
    productId?: string;

    @IsOptional()
    @IsMongoId()
    categoryId?: string;

    @IsOptional()
    @IsMongoId()
    subCategoryId?: string;

    @IsOptional()
    @IsNumber()
    sortOrder?: number;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true')
    isActive?: boolean;
}

// Update Banner DTO
export class UpdateBannerDto extends PartialType(CreateBannerDto) { }

// Banner Query DTO
export class BannerQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number = 20;

    @IsOptional()
    @IsString()
    sort?: string = 'sortOrder';

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true')
    isActive?: boolean;

    @IsOptional()
    @IsMongoId()
    productId?: string;

    @IsOptional()
    @IsMongoId()
    categoryId?: string;

    @IsOptional()
    @IsMongoId()
    subCategoryId?: string;

    @IsOptional()
    @IsString()
    search?: string;
}

// Create Banner Form Data DTO (for file uploads)
export class CreateBannerFormDataDto {
    @IsOptional()
    @IsString()
    image: string;

    // One of these three will be required
    @IsOptional()
    @IsString()
    productId?: string;

    @IsOptional()
    @IsString()
    categoryId?: string;

    @IsOptional()
    @IsString()
    subCategoryId?: string;

    @IsOptional()
    @IsString()
    sortOrder?: string;

    @IsOptional()
    @IsString()
    isActive?: string;
}

// Update Banner Form Data DTO
export class UpdateBannerFormDataDto extends PartialType(CreateBannerFormDataDto) { }

// Update Sort Order DTO
export class UpdateSortOrderDto {
    @IsNumber()
    sortOrder: number;
}
