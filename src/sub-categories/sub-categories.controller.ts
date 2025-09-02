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
} from '@nestjs/common';
import { SubCategoriesService } from './sub-categories.service';
import { CreateSubCategoryDto } from './dto/create-sub-category.dto';
import { UpdateSubCategoryDto } from './dto/update-sub-category.dto';
import { SubCategoryQueryDto } from './dto/sub-category-query.dto';
import { JwtAuthGuard, RolesGuard } from '../auth/gurads';
import { Roles } from '../auth/decorators/role.decorator';
import { UserRole } from '../common/enums';

@Controller('sub-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubCategoriesController {
    constructor(private readonly subCategoriesService: SubCategoriesService) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    create(@Body() createSubCategoryDto: CreateSubCategoryDto) {
        return this.subCategoriesService.create(createSubCategoryDto);
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
    findAll(@Query() query: SubCategoryQueryDto) {
        return this.subCategoriesService.findAll(query);
    }

    @Get('category/:categoryId')
    findByCategory(@Param('categoryId') categoryId: string) {
        return this.subCategoriesService.findByCategory(categoryId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.subCategoriesService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateSubCategoryDto: UpdateSubCategoryDto) {
        return this.subCategoriesService.update(id, updateSubCategoryDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.subCategoriesService.remove(id);
    }
}
