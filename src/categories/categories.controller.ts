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
    Request,
    HttpCode,
    HttpStatus,
    UploadedFiles,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import {
    CreateCategoryDto,
    UpdateCategoryDto,
    CategoryQueryDto,
    UpdateSortOrderDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from 'src/auth/gurads';
import { UserRole } from 'src/common/enums';
import { Roles } from 'src/auth/decorators/role.decorator';
import { CategoryImagesUpload } from 'src/common/decorators';

@Controller('categories')
// @UseGuards(JwtAuthGuard,RolesGuard)
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @CategoryImagesUpload()
    async create(
        @Body() createCategoryDto: CreateCategoryDto,
        @Request() req,
        @UploadedFiles() files: {
            image?: Express.Multer.File[];
            banner?: Express.Multer.File[];
        },
    ) {
        // Handle uploaded files
        if (files.image && files.image[0]) {
            const imageFile = files.image[0];
            createCategoryDto.image = `/uploads/categories/${imageFile.filename}`;
        }
        const category = await this.categoriesService.create(
            createCategoryDto,
            req.user.sub,
        );
        return {
            success: true,
            message: 'تم إنشاء التصنيف بنجاح',
            data: category,
        };
    }

    @Get()
    async findAll(@Query() query: CategoryQueryDto) {
        const result = await this.categoriesService.findAll(query);
        return {
            success: true,
            message: 'تم جلب التصنيفات بنجاح',
            data: result.data,
            pagination: result.pagination,
        };
    }



    @Get('stats')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async getCategoryStats() {
        const stats = await this.categoriesService.getCategoryStats();
        return {
            success: true,
            message: 'تم جلب إحصائيات التصنيفات بنجاح',
            data: stats,
        };
    }



    @Get(':id')
    async findOne(
        @Param('id') id: string,
    ) {
        const category = await this.categoriesService.findById(
            id
        );
        return {
            success: true,
            message: 'تم جلب التصنيف بنجاح',
            data: category,
        };
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @CategoryImagesUpload()
    async update(
        @Param('id') id: string,
        @Body() updateCategoryDto: UpdateCategoryDto,
        @Request() req,
        @UploadedFiles() files: {
            image?: Express.Multer.File[];
        },
    ) {
        // Handle uploaded files
        if (files.image && files.image[0]) {
            const imageFile = files.image[0];
            updateCategoryDto.image = `/uploads/categories/${imageFile.filename}`;
        }


        const category = await this.categoriesService.update(
            id,
            updateCategoryDto,
            req.user.sub,
        );
        return {
            success: true,
            message: 'تم تحديث التصنيف بنجاح',
            data: category,
        };
    }

    @Patch(':id/toggle-active')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async toggleActive(@Param('id') id: string, @Request() req) {
        const category = await this.categoriesService.toggleActive(
            id,
            req.user.sub,
        );
        return {
            success: true,
            message: 'تم تحديث حالة التصنيف بنجاح',
            data: category,
        };
    }

    @Patch(':id/sort-order')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async updateSortOrder(
        @Param('id') id: string,
        @Body() updateSortOrderDto: UpdateSortOrderDto,
        @Request() req,
    ) {
        const category = await this.categoriesService.updateSortOrder(
            id,
            updateSortOrderDto.sortOrder,
            req.user.sub,
        );
        return {
            success: true,
            message: 'تم تحديث ترتيب التصنيف بنجاح',
            data: category,
        };
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    async remove(@Param('id') id: string, @Request() req) {
        await this.categoriesService.remove(id, req.user.sub);
        return {
            success: true,
            message: 'تم حذف التصنيف بنجاح',
        };
    }
}