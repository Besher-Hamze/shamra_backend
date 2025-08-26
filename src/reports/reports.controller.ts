import {
    Controller,
    Get,
    Query,
    Res,
    Response,
    UseGuards,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard, RolesGuard } from 'src/auth/gurads';
import { UserRole } from 'src/common/enums';
import { Roles } from 'src/auth/decorators/role.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('dashboard')
    async getDashboardSummary() {
        const summary = await this.reportsService.getDashboardSummary();
        return {
            success: true,
            message: 'تم جلب ملخص لوحة التحكم بنجاح',
            data: summary,
        };
    }

    @Get('sales')
    async getSalesReport(
        @Query('startDate') startDateStr: string,
        @Query('endDate') endDateStr: string,
        @Query('branchId') branchId?: string,
    ) {
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return {
                success: false,
                message: 'تاريخ البداية والنهاية يجب أن يكون صحيحاً',
            };
        }

        const report = await this.reportsService.getSalesReport(startDate, endDate, branchId);
        return {
            success: true,
            message: 'تم جلب تقرير المبيعات بنجاح',
            data: report,
        };
    }

    @Get('sales/export')
    async exportSalesReport(
        @Res() res: any,
        @Query('startDate') startDateStr: string,
        @Query('endDate') endDateStr: string,
        @Query('branchId') branchId?: string,
        @Query('format') format: 'csv' | 'json' = 'json',
    ) {
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'تاريخ البداية والنهاية يجب أن يكون صحيحاً',
            });
        }

        const exportData = await this.reportsService.exportSalesReport(startDate, endDate, branchId, format);

        res.setHeader('Content-Type', exportData.contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);

        if (format === 'csv') {
            res.send(exportData.data);
        } else {
            res.json(exportData.data);
        }
    }

    @Get('top-selling-products')
    async getTopSellingProducts(
        @Query('startDate') startDateStr: string,
        @Query('endDate') endDateStr: string,
        @Query('limit') limit?: string,
        @Query('branchId') branchId?: string,
    ) {
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return {
                success: false,
                message: 'تاريخ البداية والنهاية يجب أن يكون صحيحاً',
            };
        }

        const products = await this.reportsService.getTopSellingProducts(
            startDate,
            endDate,
            limit ? parseInt(limit) : 10,
            branchId,
        );

        return {
            success: true,
            message: 'تم جلب المنتجات الأكثر مبيعاً بنجاح',
            data: products,
        };
    }

    @Get('customers')
    async getCustomerReport(
        @Query('startDate') startDateStr: string,
        @Query('endDate') endDateStr: string,
    ) {
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return {
                success: false,
                message: 'تاريخ البداية والنهاية يجب أن يكون صحيحاً',
            };
        }

        const report = await this.reportsService.getCustomerReport(startDate, endDate);
        return {
            success: true,
            message: 'تم جلب تقرير العملاء بنجاح',
            data: report,
        };
    }

    @Get('inventory')
    async getInventoryReport(@Query('branchId') branchId?: string) {
        const report = await this.reportsService.getInventoryReport(branchId);
        return {
            success: true,
            message: 'تم جلب تقرير المخزون بنجاح',
            data: report,
        };
    }

    @Get('branches/performance')
    async getBranchPerformanceReport(
        @Query('startDate') startDateStr: string,
        @Query('endDate') endDateStr: string,
    ) {
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return {
                success: false,
                message: 'تاريخ البداية والنهاية يجب أن يكون صحيحاً',
            };
        }

        const report = await this.reportsService.getBranchPerformanceReport(startDate, endDate);
        return {
            success: true,
            message: 'تم جلب تقرير أداء الفروع بنجاح',
            data: report,
        };
    }

    @Get('products/performance')
    async getProductPerformanceReport(
        @Query('startDate') startDateStr: string,
        @Query('endDate') endDateStr: string,
        @Query('branchId') branchId?: string,
    ) {
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return {
                success: false,
                message: 'تاريخ البداية والنهاية يجب أن يكون صحيحاً',
            };
        }

        const report = await this.reportsService.getProductPerformanceReport(startDate, endDate, branchId);
        return {
            success: true,
            message: 'تم جلب تقرير أداء المنتجات بنجاح',
            data: report,
        };
    }

    @Get('financial')
    async getFinancialReport(
        @Query('startDate') startDateStr: string,
        @Query('endDate') endDateStr: string,
        @Query('branchId') branchId?: string,
    ) {
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return {
                success: false,
                message: 'تاريخ البداية والنهاية يجب أن يكون صحيحاً',
            };
        }

        const report = await this.reportsService.getFinancialReport(startDate, endDate, branchId);
        return {
            success: true,
            message: 'تم جلب التقرير المالي بنجاح',
            data: report,
        };
    }

    @Get('summary')
    async getSummaryReport(
        @Query('startDate') startDateStr: string,
        @Query('endDate') endDateStr: string,
        @Query('branchId') branchId?: string,
    ) {
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return {
                success: false,
                message: 'تاريخ البداية والنهاية يجب أن يكون صحيحاً',
            };
        }

        const [salesReport, customerReport, inventoryReport] = await Promise.all([
            this.reportsService.getSalesReport(startDate, endDate, branchId),
            this.reportsService.getCustomerReport(startDate, endDate),
            this.reportsService.getInventoryReport(branchId),
        ]);

        return {
            success: true,
            message: 'تم جلب التقرير الملخص بنجاح',
            data: {
                period: { startDate, endDate },
                sales: salesReport,
                customers: customerReport,
                inventory: inventoryReport,
            },
        };
    }
}
