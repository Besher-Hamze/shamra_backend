import {
    Injectable,
    NotFoundException,
    BadRequestException,
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
import { OrderStatus } from 'src/common/enums';
import { User, UserDocument } from 'src/users/scheme/user.scheme';

@Injectable()
export class OrdersService {
    constructor(
        @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    ) { }

    // Create new order
    async create(createOrderDto: CreateOrderDto, userId: string): Promise<Order> {
        const { items, branchId } = createOrderDto;

        // Verify customer exists
        const customer = await this.userModel.findById(userId).exec();
        if (!customer || customer.isDeleted) {
            throw new NotFoundException('Customer not found');
        }

        // Verify all products exist and calculate totals
        const orderItems = [];
        let subtotal = 0;

        for (const item of items) {
            const product = await this.productModel.findById(item.productId).exec() as any;
            if (!product || product.isDeleted || !product.isActive) {
                throw new NotFoundException(`Product ${item.productName} not found or inactive`);
            }

            // Check stock
            if (product.getBranchStockQuantity(branchId) < item.quantity) {
                throw new BadRequestException(
                    `Insufficient stock for ${product.name}. Available: ${product.getBranchStockQuantity(branchId)}, Requested: ${item.quantity}`
                );
            }

            const total = item.quantity * item.price;
            orderItems.push({
                ...item,
                total,
            });
            subtotal += total;
        }
        const timestamp = Date.now().toString().slice(-8);
        const orderNumber = `ORD${timestamp}`;


        const order = new this.orderModel({
            ...createOrderDto,
            orderNumber,
            items: orderItems,
            subtotal,
            totalAmount: subtotal,
            userId,
            createdBy: userId,
            updatedBy: userId,
        });

        const savedOrder = await order.save();

        // Update product stock
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

        // Update customer stats
        await this.userModel
            .findByIdAndUpdate(userId, {
                $inc: {
                    totalOrders: 1,
                    totalSpent: savedOrder.totalAmount
                },
                lastOrderDate: new Date(),
            })
            .exec();

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

        return updatedOrder;
    }

    // Update order status
    async updateStatus(id: string, updateStatusDto: UpdateOrderStatusDto, userId: string): Promise<Order> {
        const order = await this.orderModel.findById(id).exec();
        if (!order || order.isDeleted) {
            throw new NotFoundException('Order not found');
        }

        // Handle status transitions
        if (updateStatusDto.status === OrderStatus.CANCELLED) {
            // Restore stock when order is cancelled
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

        const updatedOrder = await this.orderModel
            .findByIdAndUpdate(
                id,
                { status: updateStatusDto.status, updatedBy: userId },
                { new: true }
            )
            .populate('user', 'firstName lastName email')
            .populate('branch', 'name code')
            .exec();

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

        await this.orderModel
            .findByIdAndUpdate(id, {
                isDeleted: true,
                updatedBy: userId,
            })
            .exec();
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
}