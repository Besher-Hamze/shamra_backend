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
} from '@nestjs/common';
import { ProductsService } from './products.service';
import {
    CreateProductDto,
    UpdateProductDto,
    ProductQueryDto,
    UpdateStockDto,
    UpdatePriceDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from 'src/auth/gurads';
import { UserRole } from 'src/common/enums';
import { Roles } from 'src/auth/decorators/role.decorator';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

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