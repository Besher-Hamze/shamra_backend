import { IsOptional, IsMongoId, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class InventoryQueryDto {
    @IsOptional()
    @IsMongoId()
    productId?: string;

    @IsOptional()
    @IsMongoId()
    branchId?: string;

    @IsOptional()
    @Transform(({ value }) => value === 'true')
    @IsBoolean()
    isLowStock?: boolean;

    @IsOptional()
    @Transform(({ value }) => value === 'true')
    @IsBoolean()
    isOutOfStock?: boolean;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    page?: number = 1;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    limit?: number = 20;
}
