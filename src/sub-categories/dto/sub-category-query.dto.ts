import { IsOptional, IsString, IsMongoId, IsBoolean, IsEnum } from 'class-validator';
import { SubCategoryType } from 'src/common/enums';

export class SubCategoryQueryDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsMongoId()
    categoryId?: string;

    @IsOptional()
    @IsEnum(SubCategoryType)
    type?: SubCategoryType;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsString()
    search?: string;
}
