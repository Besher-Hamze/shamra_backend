import {
    IsString,
    IsNumber,
    IsOptional,
    IsBoolean,
    IsEnum,
    IsMongoId,
    IsArray,
    Min,
    MinLength,
    MaxLength,
    ValidateNested,
    IsObject,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ProductStatus } from 'src/common/enums';
import { PartialType } from '@nestjs/mapped-types';
import { BranchPricingDto, UpdateBranchPricingDto, BranchPricingFormDataDto } from './branch-pricing.dto';


// Create Product DTO
export class CreateProductDto {
    @IsString()
    @MinLength(2)
    @MaxLength(200)
    name: string;


    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;

    @IsOptional()
    @IsString()
    barcode?: string;


    @IsOptional()
    @IsNumber()
    @Min(0)
    minStockLevel?: number = 5;

    @IsMongoId()
    categoryId: string;

    // list of branches that the product is available in
    @IsOptional()
    @IsArray()
    @IsMongoId({ each: true })
    branches?: string[];

    // Branch-specific pricing and stock information
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BranchPricingDto)
    branchPricing?: BranchPricingDto[];

    @IsMongoId()
    subCategoryId?: string;



    @IsOptional()
    @IsArray()
    images?: string[];

    @IsOptional()
    mainImage?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    brand?: string;

    @IsOptional()
    @IsObject()
    specifications?: Record<string, any>;

    @IsOptional()
    @IsEnum(ProductStatus)
    status?: ProductStatus = ProductStatus.ACTIVE;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean = true;

    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean = false;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    keywords?: string[];

    @IsOptional()
    @IsNumber()
    @Min(0)
    sortOrder?: number = 0;

}

// Create Product Form Data DTO (for file uploads)
export class CreateProductFormDataDto {
    @MinLength(2)
    @MaxLength(200)
    name: string;

    @IsOptional()
    @MaxLength(1000)
    description?: string;

    @IsOptional()
    barcode?: string;


    @IsOptional()
    @IsString()
    minStockLevel?: string = '5';

    @IsOptional()
    @IsString()
    categoryId: string;

    @IsOptional()
    @IsString()
    subCategoryId: string;

    @IsOptional()
    branches?: string;

    @IsOptional()
    @IsString()
    branchPricing?: string; // JSON string for branch pricing

    @IsOptional()
    @MaxLength(100)
    brand?: string;

    @IsOptional()
    specifications?: string;

    @IsOptional()
    @IsEnum(ProductStatus)
    status?: string = ProductStatus.ACTIVE;

    @IsOptional()
    isActive?: string = 'true';

    @IsOptional()
    isFeatured?: string = 'false';


    @IsOptional()
    tags?: string;

    @IsOptional()
    keywords?: string;

    @IsOptional()
    sortOrder?: string = '0';
}

// Update Product DTO
export class UpdateProductDto extends PartialType(CreateProductDto) { }

// Update Product Form Data DTO (for file uploads)
export class UpdateProductFormDataDto extends PartialType(CreateProductFormDataDto) { }
export class ProductQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    limit?: number = 20;

    @IsOptional()
    @IsString()
    sort?: string = '-createdAt';

    @IsOptional()
    @IsMongoId()
    categoryId?: string;

    @IsOptional()
    @IsMongoId()
    branchId?: string;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true')
    includeBranchPricing?: boolean = false;

    @IsOptional()
    @IsMongoId()
    subCategoryId?: string;

    @IsOptional()
    @IsString()
    brand?: string;

    @IsOptional()
    @IsEnum(ProductStatus)
    status?: ProductStatus;

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
    isOnSale?: boolean;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minPrice?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maxPrice?: number;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @Transform(({ value }) => typeof value === 'string' ? value.split(',') : value)
    tags?: string[];
}

// Update Stock DTO
export class UpdateStockDto {
    @IsNumber()
    @Min(0)
    stockQuantity: number;

    @IsOptional()
    @IsString()
    reason?: string;
}

// Update Price DTO
export class UpdatePriceDto {
    @IsOptional()
    @IsNumber()
    @Min(0)
    price?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    salePrice?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    wholeSalePrice?: number;

    @IsOptional()
    @IsBoolean()
    isOnSale?: boolean;
}

// Branch Pricing Management DTOs

// Add branch to product DTO
export class AddBranchToProductDto {
    @IsMongoId()
    branchId: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => UpdateBranchPricingDto)
    pricing?: UpdateBranchPricingDto;
}

// Update branch pricing DTO
export class UpdateProductBranchPricingDto {
    @IsMongoId()
    branchId: string;

    @ValidateNested()
    @Type(() => UpdateBranchPricingDto)
    pricing: UpdateBranchPricingDto;
}

// Remove branch from product DTO
export class RemoveBranchFromProductDto {
    @IsMongoId()
    branchId: string;
}

// Get branch pricing DTO
export class GetBranchPricingDto {
    @IsMongoId()
    branchId: string;
}

// Bulk update branch pricing DTO
export class BulkUpdateBranchPricingDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateProductBranchPricingDto)
    updates: UpdateProductBranchPricingDto[];
}

// Branch stock update DTO
export class UpdateBranchStockDto {
    @IsMongoId()
    branchId: string;

    @IsNumber()
    @Min(0)
    stockQuantity: number;

    @IsOptional()
    @IsString()
    reason?: string;
}

// Branch price update DTO
export class UpdateBranchPriceDto {
    @IsMongoId()
    branchId: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    price?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    costPrice?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    wholeSalePrice?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    salePrice?: number;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsOptional()
    @IsBoolean()
    isOnSale?: boolean;
}

// Branch-specific product query DTO
export class BranchProductQueryDto extends ProductQueryDto {
    @IsMongoId()
    branchId: string;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true')
    includeInactiveBranches?: boolean = false;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true')
    includeOutOfStock?: boolean = true;
}

// Branch stock levels query DTO
export class BranchStockLevelsDto {
    @IsOptional()
    @IsArray()
    @IsMongoId({ each: true })
    branchIds?: string[];

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true')
    includeInactive?: boolean = false;

    @IsOptional()
    @IsNumber()
    @Min(0)
    minStockLevel?: number;
}