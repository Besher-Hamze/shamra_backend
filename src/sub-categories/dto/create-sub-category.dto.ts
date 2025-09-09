import { IsString, IsMongoId, IsOptional, IsBoolean, IsEnum, IsArray } from 'class-validator';
import { SubCategoryType } from 'src/common/enums';

export class CreateSubCategoryDto {
    @IsString()
    name: string;

    @IsOptional()
    image?: string;

    @IsMongoId()
    categoryId: string;

    @IsOptional()
    @IsEnum(SubCategoryType)
    type?: SubCategoryType;

    @IsOptional()
    customFields?: string[];

    @IsOptional()
    // @IsBoolean()
    isActive?: string;
}
