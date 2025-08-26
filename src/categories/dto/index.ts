import {
    IsString,
    IsOptional,
    IsBoolean,
    IsNumber,
    IsMongoId,
    MinLength,
    MaxLength,
    IsUrl,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// Create Category DTO
export class CreateCategoryDto {
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name: string;

    @IsString()
    @MinLength(2)
    @MaxLength(100)
    nameAr: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    descriptionAr?: string;

    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    slug?: string;

    @IsOptional()
    @IsUrl()
    image?: string;

    @IsOptional()
    @IsString()
    icon?: string;

    @IsOptional()
    @IsMongoId()
    parentId?: string;

    @IsOptional()
    @IsNumber()
    sortOrder?: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;
}

// Update Category DTO
export class UpdateCategoryDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name?: string;

    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    nameAr?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    descriptionAr?: string;

    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    slug?: string;

    @IsOptional()
    @IsUrl()
    image?: string;

    @IsOptional()
    @IsString()
    icon?: string;

    @IsOptional()
    @IsMongoId()
    parentId?: string;

    @IsOptional()
    @IsNumber()
    sortOrder?: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;
}

// Category Query DTO
export class CategoryQueryDto {
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
    @IsMongoId()
    parentId?: string;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true')
    isActive?: boolean;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true')
    isFeatured?: boolean;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true')
    rootOnly?: boolean; // Get only root categories (no parent)

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true')
    withChildren?: boolean; // Include children in response

    @IsOptional()
    @IsString()
    search?: string;
}

// Update Sort Order DTO
export class UpdateSortOrderDto {
    @IsNumber()
    sortOrder: number;
}