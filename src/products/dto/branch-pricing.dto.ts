import { IsNotEmpty, IsNumber, IsOptional, IsBoolean, IsString, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class BranchPricingDto {
    @IsNotEmpty()
    @Type(() => String)
    branchId: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    price: number;

    @IsNotEmpty()
    @IsString()
    sku: string;


    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    costPrice: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    wholeSalePrice: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    salePrice?: number;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    stockQuantity: number;

    @IsOptional()
    @IsBoolean()
    isOnSale?: boolean;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

// Form data version for file uploads (expects strings)
export class BranchPricingFormDataDto {
    @IsNotEmpty()
    @Type(() => String)
    branchId: string;

    @IsNotEmpty()
    @IsString()
    sku: string;

    @IsNotEmpty()
    @IsString()
    price: string;

    @IsNotEmpty()
    @IsString()
    costPrice: string;

    @IsNotEmpty()
    @IsString()
    wholeSalePrice: string;

    @IsOptional()
    @IsString()
    salePrice?: string;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsNotEmpty()
    @IsString()
    stockQuantity: string;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => value === 'true' || value === true)
    isOnSale?: boolean;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => value === 'true' || value === true)
    isActive?: boolean;
}

export class UpdateBranchPricingDto {
    @IsOptional()
    @IsNumber()
    @Min(0)
    sku?: string;

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
    @IsNumber()
    @Min(0)
    stockQuantity?: number;

    @IsOptional()
    @IsBoolean()
    isOnSale?: boolean;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
