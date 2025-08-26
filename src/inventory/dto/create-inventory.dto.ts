import { IsMongoId, IsNumber, IsString, IsOptional, Min, IsEnum } from 'class-validator';

export class CreateInventoryDto {
    @IsMongoId()
    productId: string;

    @IsMongoId()
    branchId: string;

    @IsNumber()
    @Min(0)
    currentStock: number;

    @IsNumber()
    @Min(0)
    minStockLevel: number;

    @IsNumber()
    @Min(0)
    maxStockLevel: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    reorderPoint?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    reorderQuantity?: number;

    @IsNumber()
    @Min(0)
    unitCost: number;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsOptional()
    @IsString()
    unit?: string;
}
