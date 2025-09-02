import { IsString, IsMongoId, IsOptional, IsBoolean } from 'class-validator';

export class CreateSubCategoryDto {
    @IsString()
    name: string;

    @IsOptional()
    image?: string;

    @IsMongoId()
    categoryId: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
