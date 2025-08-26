import { IsOptional, IsEnum, IsMongoId, IsString, IsBoolean } from 'class-validator';
import { NotificationType } from 'src/common/enums';
import { Transform } from 'class-transformer';

export class NotificationQueryDto {
    @IsOptional()
    @IsMongoId()
    recipientId?: string;

    @IsOptional()
    @IsEnum(NotificationType)
    type?: NotificationType;

    @IsOptional()
    @IsMongoId()
    branchId?: string;

    @IsOptional()
    @Transform(({ value }) => value === 'true')
    @IsBoolean()
    isRead?: boolean;

    @IsOptional()
    @IsString()
    priority?: string;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    page?: number = 1;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    limit?: number = 20;
}
