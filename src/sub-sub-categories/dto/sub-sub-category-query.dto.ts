import { IsOptional, IsString, IsMongoId, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class SubSubCategoryQueryDto {
    @IsOptional()
    @IsMongoId()
    subCategoryId?: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @Type(() => Boolean)
    @Transform(({ value }) => value === 'true')
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsString()
    search?: string;
}

