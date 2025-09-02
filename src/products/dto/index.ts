import {
    IsString,
    IsNumber,
    IsOptional,
    IsBoolean,
    IsEnum,
    IsMongoId,
    IsArray,
    IsUrl,
    Min,
    MinLength,
    MaxLength,
    ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ProductStatus } from 'src/common/enums';

// Dimensions DTO
export class DimensionsDto {
    @IsOptional()
    @IsNumber()
    @Min(0)
    length?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    width?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    height?: number;
}

// Create Product DTO
export class CreateProductDto {
    @IsString()
    @MinLength(2)
    @MaxLength(200)
    name: string;

    @IsString()
    @MinLength(2)
    @MaxLength(200)
    nameAr: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    descriptionAr?: string;

    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(50)
    sku?: string;

    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(200)
    slug?: string;

    @IsOptional()
    @IsString()
    barcode?: string;

    @IsNumber()
    @Min(0)
    price: number;

    @IsNumber()
    @Min(0)
    costPrice: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    salePrice?: number;

    @IsOptional()
    @IsString()
    @MaxLength(3)
    currency?: string = 'SYP';

    @IsOptional()
    @IsNumber()
    @Min(0)
    stockQuantity?: number = 0;

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



    @IsOptional()
    @IsMongoId()
    subCategoryId?: string;

    @IsOptional()
    @IsArray()
    @IsMongoId({ each: true })
    additionalCategories?: string[];

    @IsOptional()
    @IsArray()
    @IsUrl({}, { each: true })
    images?: string[];

    @IsOptional()
    @IsUrl()
    mainImage?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    brand?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    model?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    weight?: number;

    @IsOptional()
    @ValidateNested()
    @Type(() => DimensionsDto)
    dimensions?: DimensionsDto;

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
    @IsBoolean()
    isOnSale?: boolean = false;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    @IsString()
    @MaxLength(60)
    metaTitle?: string;

    @IsOptional()
    @IsString()
    @MaxLength(160)
    metaDescription?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    keywords?: string[];

    @IsOptional()
    @IsNumber()
    @Min(0)
    sortOrder?: number = 0;
}

// Update Product DTO
export class UpdateProductDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(200)
    name?: string;

    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(200)
    nameAr?: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    descriptionAr?: string;

    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(50)
    sku?: string;

    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(200)
    slug?: string;

    @IsOptional()
    @IsString()
    barcode?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    price?: number;

    @IsOptional()
    @IsMongoId()
    branchId?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    costPrice?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    salePrice?: number;

    @IsOptional()
    @IsString()
    @MaxLength(3)
    currency?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    stockQuantity?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    minStockLevel?: number;

    @IsOptional()
    @IsMongoId()
    categoryId?: string;

    @IsOptional()
    @IsMongoId()
    subCategoryId?: string;

    @IsOptional()
    @IsArray()
    @IsMongoId({ each: true })
    additionalCategories?: string[];

    @IsOptional()
    @IsArray()
    @IsUrl({}, { each: true })
    images?: string[];

    @IsOptional()
    @IsUrl()
    mainImage?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    brand?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    model?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    weight?: number;

    @IsOptional()
    @ValidateNested()
    @Type(() => DimensionsDto)
    dimensions?: DimensionsDto;

    @IsOptional()
    @IsEnum(ProductStatus)
    status?: ProductStatus;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;

    @IsOptional()
    @IsBoolean()
    isOnSale?: boolean;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    @IsString()
    @MaxLength(60)
    metaTitle?: string;

    @IsOptional()
    @IsString()
    @MaxLength(160)
    metaDescription?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    keywords?: string[];

    @IsOptional()
    @IsNumber()
    @Min(0)
    sortOrder?: number;
}

// Product Query DTO
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
    @IsBoolean()
    isOnSale?: boolean;
}