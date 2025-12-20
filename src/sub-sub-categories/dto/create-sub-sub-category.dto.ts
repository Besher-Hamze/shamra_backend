import { IsString, IsMongoId, IsOptional } from 'class-validator';

export class CreateSubSubCategoryDto {
    @IsString()
    name: string;

    @IsOptional()
    image?: string;

    @IsMongoId()
    subCategoryId: string;
}

