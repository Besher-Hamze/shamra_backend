import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';

export class CreateSettingDto {
    @IsString()
    key: string;


    value: any;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    descriptionAr?: string;

    @IsOptional()
    @IsEnum(['string', 'number', 'boolean', 'object', 'array'])
    type?: 'string' | 'number' | 'boolean' | 'object' | 'array';

    @IsOptional()
    @IsEnum(['general', 'business', 'email', 'payment', 'notification', 'system'])
    category?: 'general' | 'business' | 'email' | 'payment' | 'notification' | 'system';

    @IsOptional()
    @IsBoolean()
    isPublic?: boolean;

    @IsOptional()
    @IsBoolean()
    isEditable?: boolean;
}
