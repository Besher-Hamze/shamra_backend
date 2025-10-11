import {
    IsString,
    IsOptional,
    IsNumber,
    IsEnum,
    IsMongoId,
    Min,
    Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// Excel Import DTO
export class ImportInventoryDto {
    @IsMongoId()
    branchId: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsEnum(['replace', 'add', 'subtract'])
    importMode?: 'replace' | 'add' | 'subtract' = 'replace';
}

// Excel Row Data DTO (for validation)
export class ExcelRowDataDto {
    @IsString()
    productCode: string; // SKU or barcode

    @IsNumber()
    @Min(0)
    quantity: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    unitCost?: number;
}

// Import Result DTO
export class ImportResultDto {
    success: boolean;
    message: string;
    totalRows: number;
    processedRows: number;
    skippedRows: number;
    errors: ImportErrorDto[];
    summary: ImportSummaryDto;
}

// Import Error DTO
export class ImportErrorDto {
    row: number;
    productCode: string;
    error: string;
    data?: any;
}

// Import Summary DTO
export class ImportSummaryDto {
    productsUpdated: number;
    productsCreated: number;
    productsNotFound: number;
    totalQuantityUpdated: number;
    totalValueUpdated: number;
}
