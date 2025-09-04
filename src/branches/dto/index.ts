import {
    IsString,
    IsNumber,
    IsOptional,
    IsBoolean,
    IsMongoId,
    IsEmail,
    IsUrl,
    MinLength,
    MaxLength,
    ValidateNested,
    IsPhoneNumber,
    Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class CoordinatesDto {
    @IsNumber()
    @Min(-90)
    @Type(() => Number)
    lat: number;

    @IsNumber()
    @Min(-180)
    @Type(() => Number)
    lng: number;
}

// Address DTO
export class AddressDto {
    @IsString()
    @MinLength(5)
    @MaxLength(200)
    street: string;

    @IsString()
    @MinLength(2)
    @MaxLength(100)
    city: string;





    @IsOptional()
    @IsString()
    @MaxLength(100)
    country?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => CoordinatesDto)
    coordinates?: CoordinatesDto;
}

// Coordinates DTO

// Operating Hours DTO
export class DayHoursDto {
    @IsString()
    open: string; // Format: "09:00"

    @IsString()
    close: string; // Format: "18:00"
}

export class OperatingHoursDto {
    @IsOptional()
    @ValidateNested()
    @Type(() => DayHoursDto)
    monday?: DayHoursDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => DayHoursDto)
    tuesday?: DayHoursDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => DayHoursDto)
    wednesday?: DayHoursDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => DayHoursDto)
    thursday?: DayHoursDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => DayHoursDto)
    friday?: DayHoursDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => DayHoursDto)
    saturday?: DayHoursDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => DayHoursDto)
    sunday?: DayHoursDto;
}

// Create Branch DTO
export class CreateBranchDto {
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name: string;



    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;




    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsEmail()
    email?: string;


    @ValidateNested()
    @Type(() => AddressDto)
    address: AddressDto;

    @IsOptional()
    @IsMongoId()
    managerId?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean = true;

    @IsOptional()
    @IsBoolean()
    isMainBranch?: boolean = false;

    @IsOptional()
    @ValidateNested()
    @Type(() => OperatingHoursDto)
    operatingHours?: OperatingHoursDto;

    @IsOptional()
    @IsNumber()
    @Min(0)
    sortOrder?: number = 0;
}

// Update Branch DTO
export class UpdateBranchDto extends PartialType(CreateBranchDto) { }

// Branch Query DTO
export class BranchQueryDto {
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
    sort?: string = 'sortOrder';

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true')
    isActive?: boolean;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true')
    isMainBranch?: boolean;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsMongoId()
    managerId?: string;

    @IsOptional()
    @IsString()
    search?: string;
}

// Update Sort Order DTO
export class UpdateSortOrderDto {
    @IsNumber()
    @Min(0)
    sortOrder: number;
}