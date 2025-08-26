import { IsOptional, IsNumber, Min, Max, IsString, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';

// Pagination DTO
export class PaginationDto {
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
    @IsString()
    sort?: string;


    @IsOptional()
    @IsString()
    fields?: string;


    @IsOptional()
    @IsString()
    search?: string;
}

// Search DTO
export class SearchDto extends PaginationDto {

    @IsOptional()
    @IsString()
    category?: string;


    @IsOptional()
    @IsString()
    brand?: string;


    @IsOptional()
    @Type(() => Number)
    minPrice?: number;


    @IsOptional()
    @Type(() => Number)
    maxPrice?: number;


    @IsOptional()
    @IsString()
    status?: string;
}

// Address DTO
export class AddressDto {

    @IsOptional()
    @IsString()
    street?: string;


    @IsOptional()
    @IsString()
    city?: string;


    @IsOptional()
    @IsString()
    state?: string;


    @IsOptional()
    @IsString()
    zipCode?: string;


    @IsOptional()
    @IsString()
    country?: string;


    @IsOptional()
    coordinates?: {
        lat: number;
        lng: number;
    };
}

// Contact Info DTO
export class ContactInfoDto {

    @IsOptional()
    @IsString()
    phone?: string;


    @IsOptional()
    @IsString()
    mobile?: string;


    @IsOptional()
    @IsString()
    email?: string;


    @IsOptional()
    @IsString()
    website?: string;
}