import { IsMongoId, IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class StockTransferDto {
    @IsMongoId()
    productId: string;

    @IsMongoId()
    fromBranchId: string;

    @IsMongoId()
    toBranchId: string;

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
}
