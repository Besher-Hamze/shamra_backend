import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class SettingsQueryDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsEnum(['general', 'business', 'email', 'payment', 'notification', 'system'])
    category?: string;

    @IsOptional()
    @Transform(({ value }) => value === 'true')
    @IsBoolean()
    isPublic?: boolean;

    @IsOptional()
    @Transform(({ value }) => value === 'true')
    @IsBoolean()
    isEditable?: boolean;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    page?: number = 1;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    limit?: number = 20;
}
