import { IsOptional, IsMongoId, IsString, IsEnum } from 'class-validator';
import { InventoryTransactionType } from 'src/common/enums';
import { Transform } from 'class-transformer';

export class InventoryTransactionQueryDto {
    @IsOptional()
    @IsMongoId()
    productId?: string;

    @IsOptional()
    @IsMongoId()
    branchId?: string;

    @IsOptional()
    @IsEnum(InventoryTransactionType)
    type?: InventoryTransactionType;

    @IsOptional()
    @IsString()
    reference?: string;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    page?: number = 1;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    limit?: number = 20;
}
