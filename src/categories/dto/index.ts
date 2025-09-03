import {
    IsString,
    IsOptional,
    IsBoolean,
    IsNumber,
    MinLength,
    MaxLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

// Create Category DTO
export class CreateCategoryDto {
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name: string;

    @IsOptional()
    image?: string;

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
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) { }

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
    @IsString()
    search?: string;
}

// Update Sort Order DTO
export class UpdateSortOrderDto {
    @IsNumber()
    sortOrder: number;
}