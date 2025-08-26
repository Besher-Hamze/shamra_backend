import {
    IsString,
    IsNumber,
    IsOptional,
    IsBoolean,
    IsEmail,
    MinLength,
    MaxLength,
    ValidateNested,
    Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// Simple Address DTO
export class AddressDto {
    @IsOptional()
    @IsString()
    @MaxLength(200)
    street?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    city?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    country?: string;
}

// Create Customer DTO
export class CreateCustomerDto {
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    firstName: string;

    @IsString()
    @MinLength(2)
    @MaxLength(50)
    lastName: string;

    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    phoneNumber?: string;

    @IsOptional()
    @IsString()
    @MinLength(4)
    @MaxLength(20)
    customerCode?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => AddressDto)
    address?: AddressDto;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean = true;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    notes?: string;
}

// Update Customer DTO
export class UpdateCustomerDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    firstName?: string;

    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    lastName?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    phoneNumber?: string;

    @IsOptional()
    @IsString()
    @MinLength(4)
    @MaxLength(20)
    customerCode?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => AddressDto)
    address?: AddressDto;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    notes?: string;
}

// Customer Query DTO
export class CustomerQueryDto {
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
    @IsBoolean()
    @Transform(({ value }) => value === 'true')
    isActive?: boolean;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    search?: string;
}

// Update Customer Stats DTO (for internal use)
export class UpdateCustomerStatsDto {
    @IsOptional()
    @IsNumber()
    @Min(0)
    totalOrders?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    totalSpent?: number;
}