import { IsString, IsEnum, IsArray, IsOptional, IsObject, IsMongoId } from 'class-validator';
import { NotificationType } from 'src/common/enums';

export class BulkNotificationDto {
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

    @IsArray()
    @IsMongoId({ each: true })
    recipientIds: string[];

    @IsOptional()
    @IsMongoId()
    branchId?: string;

    @IsOptional()
    priority?: 'low' | 'medium' | 'high' | 'urgent';

    @IsOptional()
    @IsArray()
    channels?: string[];

    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
}
