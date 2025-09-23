import {
    IsString,
    IsOptional,
    IsEnum,
    IsEmail,
    MinLength,
    MaxLength,
    IsNumber,
    Min,
    Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// Create Merchant Request DTO
export class CreateMerchantRequestDto {
    @IsString()

    storeName: string;

    @IsString()
    address: string;

    @IsString()

    phoneNumber: string;

}

// Update Merchant Request DTO
export class UpdateMerchantRequestDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    storeName?: string;

    @IsOptional()
    @IsString()
    @MinLength(10)
    @MaxLength(500)
    address?: string;

    @IsOptional()
    @IsString()
    @MinLength(10)
    @MaxLength(20)
    phoneNumber?: string;


}

// Merchant Query DTO
export class MerchantQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @IsOptional()
    @IsEnum(['pending', 'approved', 'rejected'])
    status?: string;

    @IsOptional()
    @IsString()
    search?: string;
}

// Approve/Reject Merchant DTO
export class ReviewMerchantDto {
    @IsEnum(['approved', 'rejected'])
    status: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    rejectionReason?: string;
}
