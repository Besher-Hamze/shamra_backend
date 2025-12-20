import { PartialType } from '@nestjs/mapped-types';
import { CreateSubSubCategoryDto } from './create-sub-sub-category.dto';

export class UpdateSubSubCategoryDto extends PartialType(CreateSubSubCategoryDto) { }

