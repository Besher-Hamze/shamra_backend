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
    UseInterceptors,
    UploadedFile,
    Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { InventoryService } from './inventory.service';
import {
    CreateInventoryDto,
    UpdateInventoryDto,
    InventoryQueryDto,
    StockAdjustmentDto,
    StockTransferDto,
    InventoryTransactionQueryDto,
    ImportInventoryDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from 'src/auth/gurads';
import { UserRole } from 'src/common/enums';
import { Roles } from 'src/auth/decorators/role.decorator';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) { }

    @Post()
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async create(
        @Body() createInventoryDto: CreateInventoryDto,
        @Request() req,
    ) {
        const inventory = await this.inventoryService.create(
            createInventoryDto,
            req.user.sub,
        );
        return {
            success: true,
            message: 'تم إنشاء المخزون بنجاح',
            data: inventory,
        };
    }

    @Get()
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
    async findAll(@Query() query: InventoryQueryDto) {
        const result = await this.inventoryService.findAll(query);
        return {
            success: true,
            message: 'تم جلب المخزون بنجاح',
            data: result.data,
            pagination: result.pagination,
        };
    }

    @Get('stats')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async getInventoryStats(@Query('branchId') branchId?: string) {
        const stats = await this.inventoryService.getInventoryStats(branchId);
        return {
            success: true,
            message: 'تم جلب إحصائيات المخزون بنجاح',
            data: stats,
        };
    }

    @Get('low-stock')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
    async getLowStockItems(
        @Query('branchId') branchId?: string,
        @Query('limit') limit?: string,
    ) {
        const items = await this.inventoryService.getLowStockItems(
            branchId,
            limit ? parseInt(limit) : 50,
        );
        return {
            success: true,
            message: 'تم جلب المنتجات منخفضة المخزون بنجاح',
            data: items,
        };
    }

    @Get('transactions')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
    async getTransactions(@Query() query: InventoryTransactionQueryDto) {
        const result = await this.inventoryService.findTransactions(query);
        return {
            success: true,
            message: 'تم جلب معاملات المخزون بنجاح',
            data: result.data,
            pagination: result.pagination,
        };
    }

    @Get('stock-movement/:productId/:branchId')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
    async getStockMovement(
        @Param('productId') productId: string,
        @Param('branchId') branchId: string,
        @Query('days') days?: string,
    ) {
        const movements = await this.inventoryService.getStockMovement(
            productId,
            branchId,
            days ? parseInt(days) : 30,
        );
        return {
            success: true,
            message: 'تم جلب حركة المخزون بنجاح',
            data: movements,
        };
    }

    @Get(':id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
    async findOne(@Param('id') id: string) {
        const inventory = await this.inventoryService.findOne(id);
        return {
            success: true,
            message: 'تم جلب المخزون بنجاح',
            data: inventory,
        };
    }

    @Get('product/:productId/branch/:branchId')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
    async findByProductAndBranch(
        @Param('productId') productId: string,
        @Param('branchId') branchId: string,
    ) {
        const inventory = await this.inventoryService.findByProductAndBranch(
            productId,
            branchId,
        );
        return {
            success: true,
            message: 'تم جلب المخزون بنجاح',
            data: inventory,
        };
    }

    @Patch(':id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async update(
        @Param('id') id: string,
        @Body() updateInventoryDto: UpdateInventoryDto,
        @Request() req,
    ) {
        const inventory = await this.inventoryService.update(
            id,
            updateInventoryDto,
            req.user.sub,
        );
        return {
            success: true,
            message: 'تم تحديث المخزون بنجاح',
            data: inventory,
        };
    }

    @Post('adjust-stock')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
    async adjustStock(
        @Body() stockAdjustmentDto: StockAdjustmentDto,
        @Request() req,
    ) {
        const inventory = await this.inventoryService.adjustStock(
            stockAdjustmentDto,
            req.user.sub,
        );
        return {
            success: true,
            message: 'تم تعديل المخزون بنجاح',
            data: inventory,
        };
    }

    @Post('transfer-stock')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async transferStock(
        @Body() stockTransferDto: StockTransferDto,
        @Request() req,
    ) {
        const result = await this.inventoryService.transferStock(
            stockTransferDto,
            req.user.sub,
        );
        return {
            success: true,
            message: 'تم نقل المخزون بنجاح',
            data: result,
        };
    }

    @Post('reserve-stock')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
    async reserveStock(
        @Body() reserveDto: {
            productId: string;
            branchId: string;
            quantity: number;
        },
        @Request() req,
    ) {
        const inventory = await this.inventoryService.reserveStock(
            reserveDto.productId,
            reserveDto.branchId,
            reserveDto.quantity,
            req.user.sub,
        );
        return {
            success: true,
            message: 'تم حجز المخزون بنجاح',
            data: inventory,
        };
    }

    @Post('release-reserved-stock')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
    async releaseReservedStock(
        @Body() releaseDto: {
            productId: string;
            branchId: string;
            quantity: number;
        },
        @Request() req,
    ) {
        const inventory = await this.inventoryService.releaseReservedStock(
            releaseDto.productId,
            releaseDto.branchId,
            releaseDto.quantity,
            req.user.sub,
        );
        return {
            success: true,
            message: 'تم إطلاق المخزون المحجوز بنجاح',
            data: inventory,
        };
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @HttpCode(HttpStatus.OK)
    async remove(@Param('id') id: string, @Request() req) {
        await this.inventoryService.remove(id, req.user.sub);
        return {
            success: true,
            message: 'تم حذف المخزون بنجاح',
        };
    }

    // Excel Import Endpoints
    @Post('import')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @UseInterceptors(FileInterceptor('file'))
    async importFromExcel(
        @UploadedFile() file: Express.Multer.File,
        @Body() importInventoryDto: ImportInventoryDto,
        @Request() req,
    ) {
        if (!file) {
            return {
                success: false,
                message: 'الملف مطلوب',
            };
        }

        // Validate file type
        const allowedMimeTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv'
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
            return {
                success: false,
                message: 'نوع الملف غير مدعوم. يرجى رفع ملف Excel (.xlsx, .xls) أو CSV',
            };
        }

        const result = await this.inventoryService.importInventoryFromExcel(
            file,
            importInventoryDto,
            req.user.sub,
        );

        return {
            success: result.success,
            message: result.message,
            data: result,
        };
    }

    @Get('import/template')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async getImportTemplate(@Res() res: Response) {
        const templateBuffer = await this.inventoryService.getImportTemplate();

        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="inventory_import_template.xlsx"',
            'Content-Length': templateBuffer.length.toString(),
        });

        res.send(templateBuffer);
    }
}
