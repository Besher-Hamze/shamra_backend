import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from '../orders/schemes/order.scheme';
import { Product, ProductDocument } from '../products/scheme/product.schem';
import { Customer, CustomerDocument } from '../customers/scheme/customer.scheme';
import { User, UserDocument } from '../users/scheme/user.scheme';
import { Branch, BranchDocument } from '../branches/scheme/branche.scheme';
import { Inventory, InventoryDocument } from '../inventory/scheme/inventory.scheme';

@Injectable()
export class ReportsService {
    constructor(
        @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
        @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
        @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
    ) {}

    // Sales Reports
    async getSalesReport(startDate: Date, endDate: Date, branchId?: string) {
        const matchStage: any = {
            createdAt: { $gte: startDate, $lte: endDate },
            isDeleted: false,
        };

        if (branchId) {
            matchStage.branchId = new Types.ObjectId(branchId);
        }

        const salesData = await this.orderModel.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        branchId: '$branchId',
                    },
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: '$totalAmount' },
                    totalItems: { $sum: { $size: '$items' } },
                    averageOrderValue: { $avg: '$totalAmount' },
                },
            },
            { $sort: { '_id.date': 1 } },
        ]);

        const summary = await this.orderModel.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: '$totalAmount' },
                    totalItems: { $sum: { $size: '$items' } },
                    averageOrderValue: { $avg: '$totalAmount' },
                },
            },
        ]);

        return {
            period: { startDate, endDate },
            summary: summary[0] || {
                totalOrders: 0,
                totalRevenue: 0,
                totalItems: 0,
                averageOrderValue: 0,
            },
            dailyData: salesData,
        };
    }

    async getTopSellingProducts(startDate: Date, endDate: Date, limit: number = 10, branchId?: string) {
        const matchStage: any = {
            createdAt: { $gte: startDate, $lte: endDate },
            isDeleted: false,
        };

        if (branchId) {
            matchStage.branchId = new Types.ObjectId(branchId);
        }

        const topProducts = await this.orderModel.aggregate([
            { $match: matchStage },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.productId',
                    productName: { $first: '$items.productName' },
                    productSku: { $first: '$items.productSku' },
                    totalQuantity: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: '$items.total' },
                    orderCount: { $sum: 1 },
                },
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: limit },
        ]);

        return topProducts;
    }

    // Customer Reports
    async getCustomerReport(startDate: Date, endDate: Date) {
        const customerStats = await this.customerModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    isDeleted: false,
                },
            },
            {
                $group: {
                    _id: null,
                    totalCustomers: { $sum: 1 },
                    totalSpent: { $sum: '$totalSpent' },
                    averageOrderValue: { $avg: '$totalSpent' },
                },
            },
        ]);

        const topCustomers = await this.customerModel
            .find({
                isDeleted: false,
                totalSpent: { $gt: 0 },
            })
            .sort({ totalSpent: -1 })
            .limit(10)
            .select('firstName lastName email totalSpent totalOrders lastOrderDate');

        return {
            period: { startDate, endDate },
            summary: customerStats[0] || {
                totalCustomers: 0,
                totalSpent: 0,
                averageOrderValue: 0,
            },
            topCustomers,
        };
    }

    // Inventory Reports
    async getInventoryReport(branchId?: string) {
        const matchStage: any = { isDeleted: false };
        if (branchId) {
            matchStage.branchId = new Types.ObjectId(branchId);
        }

        const inventoryStats = await this.inventoryModel.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalProducts: { $sum: 1 },
                    totalStockValue: { $sum: { $multiply: ['$currentStock', '$unitCost'] } },
                    lowStockCount: { $sum: { $cond: ['$isLowStock', 1, 0] } },
                    outOfStockCount: { $sum: { $cond: ['$isOutOfStock', 1, 0] } },
                },
            },
        ]);

        const lowStockItems = await this.inventoryModel
            .find({ ...matchStage, isLowStock: true })
            .populate('productId', 'name nameAr sku')
            .populate('branchId', 'name nameAr')
            .sort({ currentStock: 1 })
            .limit(20);

        return {
            summary: inventoryStats[0] || {
                totalProducts: 0,
                totalStockValue: 0,
                lowStockCount: 0,
                outOfStockCount: 0,
            },
            lowStockItems,
        };
    }

    // Branch Performance Reports
    async getBranchPerformanceReport(startDate: Date, endDate: Date) {
        const branchPerformance = await this.orderModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    isDeleted: false,
                    branchId: { $exists: true },
                },
            },
            {
                $group: {
                    _id: '$branchId',
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: '$totalAmount' },
                    totalItems: { $sum: { $size: '$items' } },
                    averageOrderValue: { $avg: '$totalAmount' },
                },
            },
            {
                $lookup: {
                    from: 'branches',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'branch',
                },
            },
            { $unwind: '$branch' },
            {
                $project: {
                    branchName: '$branch.name',
                    branchNameAr: '$branch.nameAr',
                    totalOrders: 1,
                    totalRevenue: 1,
                    totalItems: 1,
                    averageOrderValue: 1,
                },
            },
            { $sort: { totalRevenue: -1 } },
        ]);

        return branchPerformance;
    }

    // Product Performance Reports
    async getProductPerformanceReport(startDate: Date, endDate: Date, branchId?: string) {
        const matchStage: any = {
            createdAt: { $gte: startDate, $lte: endDate },
            isDeleted: false,
        };

        if (branchId) {
            matchStage.branchId = new Types.ObjectId(branchId);
        }

        const productPerformance = await this.orderModel.aggregate([
            { $match: matchStage },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.productId',
                    productName: { $first: '$items.productName' },
                    productSku: { $first: '$items.productSku' },
                    totalQuantity: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: '$items.total' },
                    orderCount: { $sum: 1 },
                    averagePrice: { $avg: '$items.price' },
                },
            },
            { $sort: { totalRevenue: -1 } },
        ]);

        return productPerformance;
    }

    // Financial Reports
    async getFinancialReport(startDate: Date, endDate: Date, branchId?: string) {
        const matchStage: any = {
            createdAt: { $gte: startDate, $lte: endDate },
            isDeleted: false,
        };

        if (branchId) {
            matchStage.branchId = new Types.ObjectId(branchId);
        }

        const financialData = await this.orderModel.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    },
                    revenue: { $sum: '$totalAmount' },
                    orders: { $sum: 1 },
                    averageOrderValue: { $avg: '$totalAmount' },
                },
            },
            { $sort: { '_id.date': 1 } },
        ]);

        const summary = await this.orderModel.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalAmount' },
                    totalOrders: { $sum: 1 },
                    averageOrderValue: { $avg: '$totalAmount' },
                    totalTax: { $sum: '$taxAmount' },
                    totalDiscount: { $sum: '$discountAmount' },
                },
            },
        ]);

        return {
            period: { startDate, endDate },
            summary: summary[0] || {
                totalRevenue: 0,
                totalOrders: 0,
                averageOrderValue: 0,
                totalTax: 0,
                totalDiscount: 0,
            },
            dailyData: financialData,
        };
    }

    // Dashboard Summary
    async getDashboardSummary() {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

        const [todayOrders, todayRevenue, totalCustomers, totalProducts, lowStockCount] = await Promise.all([
            this.orderModel.countDocuments({
                createdAt: { $gte: startOfDay, $lt: endOfDay },
                isDeleted: false,
            }),
            this.orderModel.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startOfDay, $lt: endOfDay },
                        isDeleted: false,
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$totalAmount' },
                    },
                },
            ]),
            this.customerModel.countDocuments({ isDeleted: false }),
            this.productModel.countDocuments({ isDeleted: false }),
            this.inventoryModel.countDocuments({ isLowStock: true, isDeleted: false }),
        ]);

        return {
            today: {
                orders: todayOrders,
                revenue: todayRevenue[0]?.total || 0,
            },
            totals: {
                customers: totalCustomers,
                products: totalProducts,
                lowStockItems: lowStockCount,
            },
        };
    }

    // Export Reports
    async exportSalesReport(startDate: Date, endDate: Date, branchId?: string, format: 'csv' | 'json' = 'json') {
        const report = await this.getSalesReport(startDate, endDate, branchId);
        
        if (format === 'csv') {
            // Convert to CSV format
            const csvData = this.convertToCSV(report);
            return {
                data: csvData,
                filename: `sales_report_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.csv`,
                contentType: 'text/csv',
            };
        }

        return {
            data: report,
            filename: `sales_report_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.json`,
            contentType: 'application/json',
        };
    }

    private convertToCSV(data: any): string {
        // Simple CSV conversion - in production, use a proper CSV library
        const headers = ['Date', 'Total Orders', 'Total Revenue', 'Total Items', 'Average Order Value'];
        const rows = data.dailyData.map((item: any) => [
            item._id.date,
            item.totalOrders,
            item.totalRevenue,
            item.totalItems,
            item.averageOrderValue.toFixed(2),
        ]);

        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    }
}
