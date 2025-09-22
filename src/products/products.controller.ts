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
import { ProductsService } from './products.service';
import {
    CreateProductDto,
    CreateProductFormDataDto,
    UpdateProductDto,
    UpdateProductFormDataDto,
    ProductQueryDto,
    UpdateStockDto,
    UpdatePriceDto,
} from './dto';
import { UserRole } from 'src/common/enums';
import { Roles } from 'src/auth/decorators/role.decorator';
import { FilesService } from 'src/files/files.service';
import { GetSelectedBranchId, ProductImagesUpload } from 'src/common/decorators';
import { parseJsonField } from 'src/common/helpers';
import { JwtAuthGuard, RolesGuard } from 'src/auth/gurads';
import { Branch } from 'src/branches/scheme/branche.scheme';
import { Types } from 'mongoose';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
    constructor(
        private readonly productsService: ProductsService,
        private readonly filesService: FilesService,
    ) { }

    // Helper method to parse JSON fields from form data




    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async create(
        @Body() createProductDto: CreateProductDto,
        @Request() req,
    ) {
        const product = await this.productsService.create(
            createProductDto,
            req.user.sub,
        );
        return {
            success: true,
            message: 'تم إنشاء المنتج بنجاح',
            data: product,
        };
    }

    @Post('with-images')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @ProductImagesUpload()
    async createWithImages(
        @Body() createProductDto: CreateProductFormDataDto,
        @UploadedFiles() files: {
            mainImage?: Express.Multer.File[];
            images?: Express.Multer.File[];
        },
        @Request() req,
    ) {
        // Process uploaded files
        const fileUrls = this.filesService.processUploadedFiles(files);


        // Transform form data to proper types
        const branchPricingData = parseJsonField(createProductDto.branchPricing, []);

        // Transform branch pricing data to proper types
        const transformedBranchPricing = branchPricingData.map((item: any) => ({
            branchId: item.branchId,
            price: parseFloat(item.price),
            sku: item.sku,
            costPrice: parseFloat(item.costPrice),
            wholeSalePrice: parseFloat(item.wholeSalePrice),
            salePrice: item.salePrice ? parseFloat(item.salePrice) : undefined,
            currency: item.currency || 'SYP',
            stockQuantity: parseFloat(item.stockQuantity),
            isOnSale: item.isOnSale === 'true' || item.isOnSale === true,
            isActive: item.isActive === 'true' || item.isActive === true,
        }));

        const productData: CreateProductDto = {
            name: createProductDto.name,
            description: createProductDto.description,
            barcode: createProductDto.barcode,
            categoryId: createProductDto.categoryId,
            subCategoryId: createProductDto.subCategoryId,
            branchPricing: transformedBranchPricing,
            branches: parseJsonField(createProductDto.branches, []),
            brand: createProductDto.brand,
            specifications: parseJsonField(createProductDto.specifications, {}),
            status: createProductDto.status as any || 'active',
            isActive: String(createProductDto.isActive) === 'true',
            isFeatured: String(createProductDto.isFeatured) === 'true',
            tags: parseJsonField(createProductDto.tags, []),
            keywords: parseJsonField(createProductDto.keywords, []),
            sortOrder: createProductDto.sortOrder ? parseInt(createProductDto.sortOrder) : 0,
            mainImage: fileUrls.mainImage,
            images: fileUrls.images,
        };

        const product = await this.productsService.create(
            productData,
            req.user.sub,
        );

        return {
            success: true,
            message: 'تم إنشاء المنتج مع الصور بنجاح',
            data: product,
        };
    }

    @Get()
    async findAll(@Query() query: ProductQueryDto, @GetSelectedBranchId() branchId?: string) {
        if (branchId) {
            query.selectedBranchId = new Types.ObjectId(branchId);
        }
        const result = await this.productsService.findAll(query);
        return {
            success: true,
            message: 'تم جلب المنتجات بنجاح',
            data: result.data,
            pagination: result.pagination,
        };
    }

    @Get('featured')
    async getFeatured(@Query('limit') limit?: string, @GetSelectedBranchId() branchId?: string) {
        const products = await this.productsService.getFeatured(
            limit ? parseInt(limit) : 10,
        );
        return {
            success: true,
            message: 'تم جلب المنتجات المميزة بنجاح',
            data: products,
        };
    }

    @Get('on-sale')
    async getOnSale(@Query('limit') limit?: string, @GetSelectedBranchId() branchId?: string) {
        const products = await this.productsService.getOnSale(
            limit ? parseInt(limit) : 20,
            branchId,
        );
        return {
            success: true,
            message: 'تم جلب المنتجات المخفضة بنجاح',
            data: products,
        };
    }

    @Get('low-stock')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
    async getLowStock(@Query('limit') limit?: string) {
        const products = await this.productsService.getLowStock(
            limit ? parseInt(limit) : 50,
        );
        return {
            success: true,
            message: 'تم جلب المنتجات قليلة المخزون بنجاح',
            data: products,
        };
    }

    @Get('stats')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async getProductStats() {
        const stats = await this.productsService.getProductStats();
        return {
            success: true,
            message: 'تم جلب إحصائيات المنتجات بنجاح',
            data: stats,
        };
    }



    @Get(':id')
    async findOne(@Param('id') id: string, @GetSelectedBranchId() branchId?: string) {
        const product = await this.productsService.findById(id);
        return {
            success: true,
            message: 'تم جلب المنتج بنجاح',
            data: product,
        };
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async update(
        @Param('id') id: string,
        @Body() updateProductDto: UpdateProductDto,
        @Request() req,
    ) {
        const product = await this.productsService.update(
            id,
            updateProductDto,
            req.user.sub,
        );
        return {
            success: true,
            message: 'تم تحديث المنتج بنجاح',
            data: product,
        };
    }

    @Patch(':id/with-images')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @ProductImagesUpload()
    async updateWithImages(
        @Param('id') id: string,
        @Body() updateProductDto: UpdateProductFormDataDto,
        @UploadedFiles() files: {
            mainImage?: Express.Multer.File[];
            images?: Express.Multer.File[];
        },
        @Request() req,
    ) {
        // Process uploaded files
        const fileUrls = this.filesService.processUploadedFiles(files);

        // Transform form data to proper types (only include provided fields)
        const productData: Partial<UpdateProductDto> = {};

        if (updateProductDto.name) productData.name = updateProductDto.name;
        if (updateProductDto.description !== undefined) productData.description = updateProductDto.description;
        if (updateProductDto.barcode !== undefined) productData.barcode = updateProductDto.barcode;
        if (updateProductDto.categoryId) productData.categoryId = updateProductDto.categoryId;
        if (updateProductDto.subCategoryId) productData.subCategoryId = updateProductDto.subCategoryId;
        if (updateProductDto.branches) {
            productData.branches = parseJsonField(updateProductDto.branches, []);
        }
        if (updateProductDto.branchPricing) {
            productData.branchPricing = parseJsonField(updateProductDto.branchPricing, []);
        }
        if (updateProductDto.brand !== undefined) productData.brand = updateProductDto.brand;
        if (updateProductDto.specifications) {
            productData.specifications = parseJsonField(updateProductDto.specifications, {});
        }
        if (updateProductDto.status) productData.status = updateProductDto.status as any;
        if (updateProductDto.isActive !== undefined) {
            if (typeof updateProductDto.isActive === 'string') {
                productData.isActive = updateProductDto.isActive === 'true';
            } else {
                productData.isActive = Boolean(updateProductDto.isActive);
            }
        }
        if (updateProductDto.isFeatured !== undefined) {
            if (typeof updateProductDto.isFeatured === 'string') {
                productData.isFeatured = updateProductDto.isFeatured === 'true';
            } else {
                productData.isFeatured = Boolean(updateProductDto.isFeatured);
            }
        }

        if (updateProductDto.tags) {
            productData.tags = parseJsonField(updateProductDto.tags, []);
        }
        if (updateProductDto.keywords) {
            productData.keywords = parseJsonField(updateProductDto.keywords, []);
        }
        if (updateProductDto.sortOrder) productData.sortOrder = parseInt(updateProductDto.sortOrder);

        // Add file URLs if files were uploaded
        if (fileUrls.mainImage) productData.mainImage = fileUrls.mainImage;
        if (fileUrls.images) productData.images = fileUrls.images;

        const product = await this.productsService.update(
            id,
            productData,
            req.user.sub,
        );

        return {
            success: true,
            message: 'تم تحديث المنتج مع الصور بنجاح',
            data: product,
        };
    }

    @Patch(':id/stock')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
    async updateStock(
        @Param('id') id: string,
        @Body() updateStockDto: UpdateStockDto,
        @Request() req,
    ) {
        const product = await this.productsService.updateStock(
            id,
            updateStockDto,
            req.user.sub,
        );
        return {
            success: true,
            message: 'تم تحديث المخزون بنجاح',
            data: product,
        };
    }

    @Patch(':id/price')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async updatePrice(
        @Param('id') id: string,
        @Body() updatePriceDto: UpdatePriceDto,
        @Request() req,
    ) {
        const product = await this.productsService.updatePrice(
            id,
            updatePriceDto,
            req.user.sub,
        );
        return {
            success: true,
            message: 'تم تحديث السعر بنجاح',
            data: product,
        };
    }

    @Patch(':id/toggle-active')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async toggleActive(@Param('id') id: string, @Request() req) {
        const product = await this.productsService.toggleActive(id, req.user.sub);
        return {
            success: true,
            message: 'تم تحديث حالة المنتج بنجاح',
            data: product,
        };
    }

    @Patch(':id/toggle-featured')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async toggleFeatured(@Param('id') id: string, @Request() req) {
        const product = await this.productsService.toggleFeatured(id, req.user.sub);
        return {
            success: true,
            message: 'تم تحديث حالة الإبراز بنجاح',
            data: product,
        };
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    async remove(@Param('id') id: string, @Request() req) {
        await this.productsService.remove(id, req.user.sub);
        return {
            success: true,
            message: 'تم حذف المنتج بنجاح',
        };
    }
}