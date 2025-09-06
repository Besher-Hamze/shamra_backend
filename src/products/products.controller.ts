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
import { JwtAuthGuard, RolesGuard } from 'src/auth/gurads';
import { UserRole } from 'src/common/enums';
import { Roles } from 'src/auth/decorators/role.decorator';
import { FilesService } from 'src/files/files.service';
import { ProductImagesUpload } from 'src/common/decorators';
import { parseJsonField } from 'src/common/helpers';

@Controller('products')
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
        const productData: CreateProductDto = {
            name: createProductDto.name,
            description: createProductDto.description,
            barcode: createProductDto.barcode,
            price: createProductDto.price ? parseFloat(createProductDto.price.toString()) : 0,
            costPrice: createProductDto.costPrice ? parseFloat(createProductDto.costPrice) : 0,
            salePrice: createProductDto.salePrice ? parseFloat(createProductDto.salePrice) : undefined,
            currency: createProductDto.currency || 'SYP',
            stockQuantity: createProductDto.stockQuantity ? parseInt(createProductDto.stockQuantity) : 0,
            minStockLevel: createProductDto.minStockLevel ? parseInt(createProductDto.minStockLevel) : 5,
            categoryId: createProductDto.categoryId,
            subCategoryId: createProductDto.subCategoryId,
            branches: parseJsonField(createProductDto.branches, []),
            brand: createProductDto.brand,
            specifications: parseJsonField(createProductDto.specifications, {}),
            status: createProductDto.status as any || 'active',
            isActive: String(createProductDto.isActive) === 'true',
            isFeatured: String(createProductDto.isFeatured) === 'true',
            isOnSale: String(createProductDto.isOnSale) === 'true',
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
    async findAll(@Query() query: ProductQueryDto) {
        const result = await this.productsService.findAll(query);
        return {
            success: true,
            message: 'تم جلب المنتجات بنجاح',
            data: result.data,
            pagination: result.pagination,
        };
    }

    @Get('featured')
    async getFeatured(@Query('limit') limit?: string) {
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
    async getOnSale(@Query('limit') limit?: string) {
        const products = await this.productsService.getOnSale(
            limit ? parseInt(limit) : 20,
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
    async findOne(@Param('id') id: string) {
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
        if (updateProductDto.price) productData.price = parseFloat(updateProductDto.price);
        if (updateProductDto.costPrice) productData.costPrice = parseFloat(updateProductDto.costPrice);
        if (updateProductDto.salePrice) productData.salePrice = parseFloat(updateProductDto.salePrice);
        if (updateProductDto.currency) productData.currency = updateProductDto.currency;
        if (updateProductDto.stockQuantity) productData.stockQuantity = parseInt(updateProductDto.stockQuantity);
        if (updateProductDto.minStockLevel) productData.minStockLevel = parseInt(updateProductDto.minStockLevel);
        if (updateProductDto.categoryId) productData.categoryId = updateProductDto.categoryId;
        if (updateProductDto.subCategoryId) productData.subCategoryId = updateProductDto.subCategoryId;
        if (updateProductDto.branches) {
            productData.branches = parseJsonField(updateProductDto.branches, []);
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
        if (updateProductDto.isOnSale !== undefined) {
            if (typeof updateProductDto.isOnSale === 'string') {
                productData.isOnSale = updateProductDto.isOnSale === 'true';
            } else {
                productData.isOnSale = Boolean(updateProductDto.isOnSale);
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