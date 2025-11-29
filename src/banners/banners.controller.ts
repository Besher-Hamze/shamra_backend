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
    UploadedFile,
} from '@nestjs/common';
import { BannersService } from './banners.service';
import {
    CreateBannerDto,
    CreateBannerFormDataDto,
    UpdateBannerDto,
    UpdateBannerFormDataDto,
    BannerQueryDto,
    UpdateSortOrderDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from 'src/auth/gurads';
import { UserRole } from 'src/common/enums';
import { Roles } from 'src/auth/decorators/role.decorator';
import { SingleFileUpload } from 'src/common/decorators';

@Controller('banners')
export class BannersController {
    constructor(private readonly bannersService: BannersService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @SingleFileUpload('image', { destination: 'uploads/banners' })
    async create(
        @Body() createBannerDto: CreateBannerFormDataDto,
        @Request() req,
        @UploadedFile() imageFile?: Express.Multer.File,
    ) {
        console.log('Image file:', imageFile);

        // Handle uploaded files
        let imageUrl = createBannerDto.image ?? "";
        if (imageFile) {
            imageUrl = `/uploads/banners/${imageFile.filename}`;
        }

        // Transform form data to proper types
        const bannerData: CreateBannerDto = {
            image: imageUrl,
            productId: createBannerDto.productId || undefined,
            categoryId: createBannerDto.categoryId || undefined,
            subCategoryId: createBannerDto.subCategoryId || undefined,
            sortOrder: createBannerDto.sortOrder ? parseInt(createBannerDto.sortOrder) : 0,
            isActive: createBannerDto.isActive === 'true' || createBannerDto.isActive === '1',
        };

        const banner = await this.bannersService.create(
            bannerData,
            req.user.userId,
        );

        return {
            success: true,
            message: 'Banner created successfully',
            data: banner,
        };
    }

    @Get()
    async findAll(@Query() query: BannerQueryDto) {
        const result = await this.bannersService.findAll(query);
        return {
            success: true,
            message: 'Banners retrieved successfully',
            ...result,
        };
    }

    @Get('active')
    async getActiveBanners(@Query('limit') limit?: number) {
        const banners = await this.bannersService.getActiveBanners(limit);
        return {
            success: true,
            message: 'Active banners retrieved successfully',
            data: banners,
        };
    }

    @Get('stats')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async getStats() {
        const stats = await this.bannersService.getBannerStats();
        return {
            success: true,
            message: 'Banner statistics retrieved successfully',
            data: stats,
        };
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const banner = await this.bannersService.findById(id);
        return {
            success: true,
            message: 'Banner retrieved successfully',
            data: banner,
        };
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @SingleFileUpload('image', { destination: 'uploads/banners' })
    async update(
        @Param('id') id: string,
        @Body() updateBannerDto: UpdateBannerFormDataDto,
        @Request() req,
        @UploadedFile() imageFile?: Express.Multer.File,
    ) {
        // Handle uploaded files
        let imageUrl = updateBannerDto.image;
        if (imageFile) {
            imageUrl = `/uploads/banners/${imageFile.filename}`;
        }

        // Transform form data to proper types
        const bannerData: UpdateBannerDto = {
            image: imageUrl,
            productId: updateBannerDto.productId || undefined,
            categoryId: updateBannerDto.categoryId || undefined,
            subCategoryId: updateBannerDto.subCategoryId || undefined,
            sortOrder: updateBannerDto.sortOrder ? parseInt(updateBannerDto.sortOrder) : undefined,
            isActive: updateBannerDto.isActive ? (updateBannerDto.isActive === 'true' || updateBannerDto.isActive === '1') : undefined,
        };

        const banner = await this.bannersService.update(
            id,
            bannerData,
            req.user.userId,
        );

        return {
            success: true,
            message: 'Banner updated successfully',
            data: banner,
        };
    }

    @Patch(':id/toggle-active')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    async toggleActive(@Param('id') id: string, @Request() req) {
        const banner = await this.bannersService.toggleActive(id, req.user.userId);
        return {
            success: true,
            message: 'Banner active status toggled successfully',
            data: banner,
        };
    }

    @Patch(':id/sort-order')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    async updateSortOrder(
        @Param('id') id: string,
        @Body() updateSortOrderDto: UpdateSortOrderDto,
        @Request() req,
    ) {
        const banner = await this.bannersService.updateSortOrder(
            id,
            updateSortOrderDto,
            req.user.userId,
        );

        return {
            success: true,
            message: 'Banner sort order updated successfully',
            data: banner,
        };
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    async remove(@Param('id') id: string, @Request() req) {
        await this.bannersService.remove(id, req.user.userId);
        return {
            success: true,
            message: 'Banner deleted successfully',
        };
    }
}
