import { IsOptional, IsString, IsMongoId, IsBoolean } from 'class-validator';

export class SubCategoryQueryDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsMongoId()
    categoryId?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsString()
    search?: string;
}
