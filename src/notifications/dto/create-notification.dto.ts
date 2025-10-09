import { IsString, IsEnum, IsOptional, IsArray, IsObject, IsMongoId } from 'class-validator';
import { NotificationType } from 'src/common/enums';

export class CreateNotificationDto {
    @IsString()
    title: string;



    @IsString()
    message: string;

    @IsOptional()
    @IsEnum(NotificationType)
    type: NotificationType;

    @IsOptional()
    @IsMongoId()
    branchId?: string;

    @IsOptional()
    @IsMongoId()
    productId?: string;

    @IsOptional()
    @IsMongoId()
    orderId?: string;

    @IsOptional()
    priority?: 'low' | 'medium' | 'high' | 'urgent';

    @IsOptional()
    @IsArray()
    channels?: string[];

    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;

@IsOptional()
    @IsString()
    fcmToken:string
}
