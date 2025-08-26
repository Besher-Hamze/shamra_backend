import { IsString, IsEnum, IsOptional, IsArray, IsObject, IsMongoId } from 'class-validator';
import { NotificationType } from 'src/common/enums';

export class CreateNotificationDto {
    @IsString()
    title: string;

    @IsString()
    titleAr: string;

    @IsString()
    message: string;

    @IsString()
    messageAr: string;

    @IsEnum(NotificationType)
    type: NotificationType;

    @IsMongoId()
    recipientId: string;

    @IsOptional()
    @IsMongoId()
    senderId?: string;

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
}
