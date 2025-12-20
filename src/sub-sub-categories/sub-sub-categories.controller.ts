import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    UploadedFiles,
} from '@nestjs/common';
import { SubSubCategoriesService } from './sub-sub-categories.service';
import { CreateSubSubCategoryDto } from './dto/create-sub-sub-category.dto';
import { UpdateSubSubCategoryDto } from './dto/update-sub-sub-category.dto';
import { SubSubCategoryQueryDto } from './dto/sub-sub-category-query.dto';
import { JwtAuthGuard, RolesGuard } from '../auth/gurads';
import { Roles } from '../auth/decorators/role.decorator';
import { UserRole } from '../common/enums';
import { SubSubCategoryImagesUpload } from 'src/common/decorators';

@Controller('sub-sub-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubSubCategoriesController {
    constructor(private readonly subSubCategoriesService: SubSubCategoriesService) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @SubSubCategoryImagesUpload()
    create(@Body() createSubSubCategoryDto: CreateSubSubCategoryDto, @UploadedFiles() files: { image?: Express.Multer.File[] }) {
        if (files.image && files.image[0]) {
            createSubSubCategoryDto.image = `/uploads/sub-sub-categories/${files.image[0].filename}`;
        }
        return this.subSubCategoriesService.create(createSubSubCategoryDto);
    }

    @Get()
    findAll(@Query() query: SubSubCategoryQueryDto) {
        return this.subSubCategoriesService.findAll(query);
    }

    @Get('sub-category/:subCategoryId')
    findBySubCategory(@Param('subCategoryId') subCategoryId: string) {
        return this.subSubCategoriesService.findBySubCategory(subCategoryId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.subSubCategoriesService.findOne(id);
    }

    @Patch(':id')
    @SubSubCategoryImagesUpload()
    update(@Param('id') id: string, @Body() updateSubSubCategoryDto: UpdateSubSubCategoryDto, @UploadedFiles() files: { image?: Express.Multer.File[] }) {
        if (files.image && files.image[0]) {
            updateSubSubCategoryDto.image = `/uploads/sub-sub-categories/${files.image[0].filename}`;
        }

        return this.subSubCategoriesService.update(id, updateSubSubCategoryDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.subSubCategoriesService.remove(id);
    }
}

