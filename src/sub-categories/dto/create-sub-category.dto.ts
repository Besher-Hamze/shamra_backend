import { IsString, IsMongoId, IsOptional, IsBoolean } from 'class-validator';

export class CreateSubCategoryDto {
    @IsString()
    name: string;

    @IsString()
    nameAr: string;

    @IsMongoId()
    categoryId: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
