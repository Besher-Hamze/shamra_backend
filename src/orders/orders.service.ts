import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
    CreateOrderDto,
    UpdateOrderDto,
    OrderQueryDto,
    UpdateOrderStatusDto,
} from './dto';
import { Order, OrderDocument } from './schemes/order.scheme';
import { Customer, CustomerDocument } from 'src/customers/scheme/customer.scheme';
import { Product, ProductDocument, ProductDocumentWithMethods } from 'src/products/scheme/product.schem';
import { CurrencyEnum, OrderStatus, UserRole } from 'src/common/enums';
import { User, UserDocument } from 'src/users/scheme/user.scheme';
import { SettingsService } from 'src/settings/settings.service';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class OrdersService {
    constructor(
        @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
        private settingsService: SettingsService,
        private readonly notificationService: NotificationsService,
    ) { }

    // Create new order
    async create(createOrderDto: CreateOrderDto, userId: string): Promise<Order> {
        const { items, branchId, pointsToRedeem, currency = CurrencyEnum.USD } = createOrderDto;

        const customer = await this.userModel.findById(userId).exec();
        if (!customer || customer.isDeleted) {
            throw new NotFoundException('Customer not found');
        }

        const orderItems = [];
        let subtotal = 0;

        for (const item of items) {
            const product = await this.productModel.findById(item.productId).exec() as any;
            if (!product || product.isDeleted || !product.isActive) {
                throw new NotFoundException(`Product ${item.productName} not found or inactive`);
            }

            if (product.getBranchStockQuantity(branchId) < item.quantity) {
                throw new BadRequestException(
                    `Insufficient stock for ${product.name}. Available: ${product.getBranchStockQuantity(branchId)}, Requested: ${item.quantity}`
                );
            }

            const total = item.quantity * item.price;
            orderItems.push({ ...item, total });
            subtotal += total;
        }

        let discountAmount = 0;
        let pointsUsed = 0;
        let discountPercent = 0;

        if (pointsToRedeem && pointsToRedeem > 0) {
            if (customer.points < pointsToRedeem) {
                throw new BadRequestException(
                    `Insufficient points. Available: ${customer.points}, Requested: ${pointsToRedeem}`
                );
            }

            // 🎯 حساب الخصم حسب العملة
            const discount = await this.calculateDiscountFromPoints(
                pointsToRedeem,
                subtotal,
                currency
            );
            discountAmount = discount.discountAmount;
            discountPercent = discount.discountPercent;
            pointsUsed = pointsToRedeem;

            console.log(
                `✅ User used ${pointsUsed} points for ${discountAmount} ${currency} discount`
            );
        }

        const timestamp = Date.now().toString().slice(-8);
        const orderNumber = `ORD${timestamp}`;
        const totalAmount = subtotal - discountAmount;

        const order = new this.orderModel({
            ...createOrderDto,
            orderNumber,
            items: orderItems,
            subtotal,
            discountAmount,
            totalAmount,
            currency,
            userId,
            createdBy: userId,
            updatedBy: userId,
        });

        const savedOrder = await order.save();

        for (const item of orderItems) {
            await this.productModel
                .findByIdAndUpdate(item.productId, {
                    $inc: {
                        stockQuantity: -item.quantity,
                        totalSales: item.quantity
                    },
                })
                .exec();
        }

        const updateData: any = {
            $inc: {
                totalOrders: 1,
                totalSpent: savedOrder.totalAmount
            },
            lastOrderDate: new Date(),
        };

        if (pointsUsed > 0) {
            updateData.$inc.points = -pointsUsed;
            updateData.$inc.totalPointsUsed = pointsUsed;
        }

        await this.userModel.findByIdAndUpdate(userId, updateData).exec();
        await this.notificationService.notifyUserOrderEvent(userId, savedOrder.status, savedOrder._id.toString(), savedOrder.orderNumber);
        return await this.orderModel.findById(savedOrder._id.toString()).lean().exec();
    }


    // Find all orders with pagination
    async findAll(query: OrderQueryDto) {
        const {
            page = 1,
            limit = 20,
            sort = '-createdAt',
            branchId,
            status,
            isPaid,
            search,
            categoryId
        } = query;

        // Build filter
        const filter: any = { isDeleted: { $ne: true } };

        if (branchId) filter.branchId = branchId;
        if (status) filter.status = status;
        if (isPaid !== undefined) filter.isPaid = isPaid;

        if (search) {
            filter.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { notes: { $regex: search, $options: 'i' } },
            ];
        }

        // Calculate pagination
        const skip = (page - 1) * limit;
        const total = await this.orderModel.countDocuments(filter).exec();
        const pages = Math.ceil(total / limit);

        // Get orders
        const orders = await this.orderModel
            .find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate('userId', 'firstName lastName email')
            .populate('branch', 'name code')
            .populate('createdBy', 'firstName lastName')
            .exec();

        return {
            data: orders,
            pagination: {
                page,
                limit,
                total,
                pages,
                hasNext: page < pages,
                hasPrev: page > 1,
            },
        };
    }

    // Find order by ID
    async findById(id: string): Promise<Order> {
        const order = await this.orderModel
            .findById(id)
            .populate('user', 'firstName lastName email customerCode address')
            .populate('branch', 'name code address')
            .populate('createdBy', 'firstName lastName')
            .populate('updatedBy', 'firstName lastName')
            .exec();

        if (!order || order.isDeleted) {
            throw new NotFoundException('Order not found');
        }

        return order;
    }

    // Find order by order number
    async findByOrderNumber(orderNumber: string): Promise<Order> {
        const order = await this.orderModel
            .findOne({ orderNumber, isDeleted: { $ne: true } })
            .populate('user', 'firstName lastName email customerCode')
            .populate('branch', 'name code')
            .exec();

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return order;
    }

    // Update order
    async update(id: string, updateOrderDto: UpdateOrderDto, userId: string): Promise<Order> {
        const order = await this.orderModel.findById(id).exec();
        if (!order || order.isDeleted) {
            throw new NotFoundException('Order not found');
        }

        // Handle payment status change
        if (updateOrderDto.isPaid && !order.isPaid) {
            updateOrderDto['paidAt'] = new Date();
        }

        const updatedOrder = await this.orderModel
            .findByIdAndUpdate(
                id,
                { ...updateOrderDto, updatedBy: userId },
                { new: true }
            )
            .populate('user', 'firstName lastName email')
            .populate('branch', 'name code')
            .exec();

        await this.notificationService.notifyUserOrderEvent(updatedOrder.userId.toString(), updatedOrder.status, updatedOrder._id.toString(), updatedOrder.orderNumber);

        return updatedOrder;
    }

    // Update order status
    async updateStatus(
        id: string,
        updateStatusDto: UpdateOrderStatusDto,
        userId: string,
        userRole: UserRole
    ): Promise<Order> {
        const order = await this.orderModel.findById(id).exec();
        if (!order || order.isDeleted) {
            throw new NotFoundException('Order not found');
        }

        if ((userRole === UserRole.MERCHANT || userRole === UserRole.CUSTOMER) && order) {
            if (order.userId.toString() !== userId) {
                throw new ForbiddenException('You are not authorized to update the order status');
            }
        }

        // Handle status transitions
        if (updateStatusDto.status === OrderStatus.CANCELLED) {
            if (order.status !== OrderStatus.CANCELLED) {
                for (const item of order.items) {
                    await this.productModel
                        .findByIdAndUpdate(item.productId, {
                            $inc: {
                                stockQuantity: item.quantity,
                                totalSales: -item.quantity
                            },
                        })
                        .exec();
                }
            }
        }

        // 🎯 منح النقاط عند إكمال الطلب
        if (updateStatusDto.status === OrderStatus.DELIVERED && order.status !== OrderStatus.DELIVERED) {
            await this.awardPoints(order);
        }

        const updatedOrder = await this.orderModel
            .findByIdAndUpdate(
                id,
                { status: updateStatusDto.status, updatedBy: userId },
                { new: true }
            )
            .populate('user', 'firstName lastName email')
            .populate('branch', 'name code')
            .exec();

        await this.notificationService.notifyUserOrderEvent(updatedOrder.userId.toString(), updatedOrder.status, updatedOrder._id.toString(), updatedOrder.orderNumber);
        return updatedOrder;
    }

    // Soft delete order
    async remove(id: string, userId: string): Promise<void> {
        const order = await this.orderModel.findById(id).exec();
        if (!order || order.isDeleted) {
            throw new NotFoundException('Order not found');
        }

        // Only allow deletion of pending orders
        if (order.status !== OrderStatus.PENDING) {
            throw new BadRequestException('Can only delete pending orders');
        }

        // Restore stock
        for (const item of order.items) {
            await this.productModel
                .findByIdAndUpdate(item.productId, {
                    $inc: {
                        stockQuantity: item.quantity,
                        totalSales: -item.quantity
                    },
                })
                .exec();
        }

        // Update customer stats
        await this.userModel
            .findByIdAndUpdate(order.userId, {
                $inc: {
                    totalOrders: -1,
                    totalSpent: -order.totalAmount
                },
            })
            .exec();


        const updatedOrder = await this.orderModel
            .findByIdAndUpdate(id, {
                isDeleted: true,
                updatedBy: userId,
            })
            .exec();
        await this.notificationService.notifyUserOrderEvent(updatedOrder.userId.toString(), OrderStatus.CANCELLED, updatedOrder._id.toString(), updatedOrder.orderNumber);
    }

    // Get recent orders
    async getRecentOrders(limit: number = 10) {
        const orders = await this.orderModel
            .find({ isDeleted: { $ne: true } })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('user', 'firstName lastName')
            .select('orderNumber totalAmount status createdAt')
            .exec();

        return orders;
    }

    // Get order statistics
    async getOrderStats() {
        const totalOrders = await this.orderModel
            .countDocuments({ isDeleted: { $ne: true } })
            .exec();

        const pendingOrders = await this.orderModel
            .countDocuments({ status: OrderStatus.PENDING, isDeleted: { $ne: true } })
            .exec();

        const completedOrders = await this.orderModel
            .countDocuments({ status: OrderStatus.DELIVERED, isDeleted: { $ne: true } })
            .exec();

        const paidOrders = await this.orderModel
            .countDocuments({ isPaid: true, isDeleted: { $ne: true } })
            .exec();

        // Revenue stats
        const revenueStats = await this.orderModel
            .aggregate([
                { $match: { isDeleted: { $ne: true } } },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$totalAmount' },
                        avgOrderValue: { $avg: '$totalAmount' },
                        paidRevenue: {
                            $sum: { $cond: [{ $eq: ['$isPaid', true] }, '$totalAmount', 0] }
                        }
                    }
                }
            ])
            .exec();

        // Orders by status
        const ordersByStatus = await this.orderModel
            .aggregate([
                { $match: { isDeleted: { $ne: true } } },
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ])
            .exec();

        const recentOrders = await this.getRecentOrders(5);

        return {
            totalOrders,
            pendingOrders,
            completedOrders,
            paidOrders,
            unpaidOrders: totalOrders - paidOrders,
            totalRevenue: revenueStats[0]?.totalRevenue || 0,
            paidRevenue: revenueStats[0]?.paidRevenue || 0,
            averageOrderValue: revenueStats[0]?.avgOrderValue || 0,
            ordersByStatus,
            recentOrders,
        };
    }

    // Get my orders
    async getMyOrders(userId: string) {
        const orders = await this.orderModel
            .find({ userId: userId, isDeleted: { $ne: true } })
            .exec();

        return orders;
    }


    private async calculatePointsEarned(amount: number, currency: string): Promise<number> {
        let pointsEarned = 0;

        switch (currency) {
            case CurrencyEnum.USD:
                const rateUSD = await this.settingsService.getValue('points_rate_usd', 10);
                pointsEarned = Math.floor((amount / 100) * rateUSD);
                break;

            case CurrencyEnum.SYP:
                const rateSYP = await this.settingsService.getValue('points_rate_syp', 10);
                pointsEarned = Math.floor((amount / 100000) * rateSYP);
                break;

            case CurrencyEnum.TRK:
                const rateTRY = await this.settingsService.getValue('points_rate_try', 10);
                pointsEarned = Math.floor((amount / 1000) * rateTRY);
                break;

            default:
                pointsEarned = 0;
        }

        return pointsEarned;
    }

    // 🎯 دالة منح النقاط عند إكمال الطلب
    private async awardPoints(order: Order): Promise<void> {
        try {
            const pointsEnabled = await this.settingsService.getValue('points_enabled', true);
            if (!pointsEnabled) return;

            const pointsEarned = await this.calculatePointsEarned(
                order.totalAmount,
                order.currency || CurrencyEnum.USD
            );

            if (pointsEarned > 0) {
                await this.userModel.findByIdAndUpdate(
                    order.userId,
                    {
                        $inc: {
                            points: pointsEarned,
                            totalPointsEarned: pointsEarned
                        }
                    }
                ).exec();

                console.log(
                    `✅ User earned ${pointsEarned} points from ${order.totalAmount} ${order.currency}`
                );
            }
        } catch (error) {
            console.error('Error awarding points:', error);
        }
    }

    // 🎯 دالة حساب الخصم من النقاط (نسبة مئوية)
    private async calculateDiscountFromPoints(
        pointsToRedeem: number,
        subtotal: number,
        currency: string
    ): Promise<{ discountAmount: number; discountPercent: number }> {
        // الحصول على نسبة الخصم لكل نقطة
        const discountRate = await this.settingsService.getValue('points_discount_rate', 1);

        // الحد الأقصى للخصم
        const maxDiscountPercent = await this.settingsService.getValue('points_max_discount_percent', 50);

        // حساب نسبة الخصم المطلوبة
        let discountPercent = pointsToRedeem * discountRate;

        // التأكد من عدم تجاوز الحد الأقصى
        if (discountPercent > maxDiscountPercent) {
            discountPercent = maxDiscountPercent;
        }

        // 🎯 حساب قيمة الخصم بناءً على العملة
        let discountAmount = 0;

        switch (currency) {
            case CurrencyEnum.USD:
                // الحصول على قيمة النقطة بالدولار (مثال: 1 نقطة = 0.1$)
                const valuePerPointUSD = await this.settingsService.getValue('points_value_usd', 0.1);
                discountAmount = pointsToRedeem * valuePerPointUSD;
                break;

            case CurrencyEnum.SYP:
                // الحصول على قيمة النقطة بالليرة السورية (مثال: 1 نقطة = 1000 ل.س)
                const valuePerPointSYP = await this.settingsService.getValue('points_value_syp', 1000);
                discountAmount = pointsToRedeem * valuePerPointSYP;
                break;

            case CurrencyEnum.TRK:
                // الحصول على قيمة النقطة بالليرة التركية (مثال: 1 نقطة = 3 ₺)
                const valuePerPointTRY = await this.settingsService.getValue('points_value_try', 3);
                discountAmount = pointsToRedeem * valuePerPointTRY;
                break;

            default:
                // Default to percentage-based discount
                discountAmount = (subtotal * discountPercent) / 100;
        }

        // التأكد من عدم تجاوز الخصم قيمة الطلب
        if (discountAmount > subtotal) {
            discountAmount = subtotal;
        }

        return { discountAmount, discountPercent };
    }
}