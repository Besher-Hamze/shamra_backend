import {
    IsString,
    IsNumber,
    IsOptional,
    IsBoolean,
    IsEnum,
    IsMongoId,
    IsArray,
    ValidateNested,
    Min,
    MinLength,
    MaxLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { OrderStatus } from 'src/common/enums';

// Order Item DTO
export class OrderItemDto {
    @IsMongoId()
    productId: string;

    @IsString()
    productName: string;

    @IsNumber()
    @Min(1)
    quantity: number;

    @IsNumber()
    @Min(0)
    price: number;
}

// Create Order DTO
export class CreateOrderDto {


    @IsOptional()
    @IsMongoId()
    branchId?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];

    @IsOptional()
    @IsNumber()
    @Min(0)
    taxAmount?: number = 0;

    @IsOptional()
    @IsNumber()
    @Min(0)
    discountAmount?: number = 0;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    notes?: string;

    @IsOptional()
    @IsBoolean()
    isPaid?: boolean = false;
}

// Update Order DTO
export class UpdateOrderDto {
    @IsOptional()
    @IsEnum(OrderStatus)
    status?: OrderStatus;

    @IsOptional()
    @IsNumber()
    @Min(0)
    taxAmount?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    discountAmount?: number;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    notes?: string;

    @IsOptional()
    @IsBoolean()
    isPaid?: boolean;
}

// Order Query DTO
export class OrderQueryDto {
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
    @IsMongoId()
    customerId?: string;

    @IsOptional()
    @IsMongoId()
    branchId?: string;

    @IsOptional()
    @IsEnum(OrderStatus)
    status?: OrderStatus;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true')
    isPaid?: boolean;

    @IsOptional()
    @IsString()
    search?: string;
}

// Update Order Status DTO
export class UpdateOrderStatusDto {
    @IsEnum(OrderStatus)
    status: OrderStatus;
}