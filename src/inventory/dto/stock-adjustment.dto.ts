import { IsMongoId, IsNumber, IsString, IsOptional, Min, IsEnum } from 'class-validator';
import { InventoryTransactionType } from 'src/common/enums';

export class StockAdjustmentDto {
    @IsMongoId()
    productId: string;

    @IsMongoId()
    branchId: string;

    @IsEnum(InventoryTransactionType)
    type: InventoryTransactionType;

    @IsNumber()
    @Min(0)
    quantity: number;

    @IsNumber()
    @Min(0)
    unitCost: number;

    @IsOptional()
    @IsString()
    reference?: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsMongoId()
    orderId?: string;
}
