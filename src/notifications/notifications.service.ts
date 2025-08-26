import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './scheme/notification.scheme';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { BulkNotificationDto } from './dto/bulk-notification.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    ) { }

    async create(createNotificationDto: CreateNotificationDto, userId: string): Promise<Notification> {
        const notification = new this.notificationModel({
            ...createNotificationDto,
            createdBy: userId,
            updatedBy: userId,
        });

        return await notification.save();
    }

    async createBulk(bulkNotificationDto: BulkNotificationDto, userId: string): Promise<Notification[]> {
        const notifications = bulkNotificationDto.recipientIds.map(recipientId => ({
            ...bulkNotificationDto,
            recipientId,
            createdBy: userId,
            updatedBy: userId,
        }));

        return await this.notificationModel.insertMany(notifications) as any;
    }

    async findAll(query: NotificationQueryDto, userId?: string) {
        const { page = 1, limit = 20, recipientId, type, branchId, isRead, priority, search } = query;
        const skip = (page - 1) * limit;

        const filter: any = { isDeleted: false };

        if (recipientId) filter.recipientId = new Types.ObjectId(recipientId);
        if (type) filter.type = type;
        if (branchId) filter.branchId = new Types.ObjectId(branchId);
        if (isRead !== undefined) filter.isRead = isRead;
        if (priority) filter.priority = priority;

        // If no recipientId is specified and userId is provided, filter by userId
        if (!recipientId && userId) {
            filter.recipientId = new Types.ObjectId(userId);
        }

        // Text search
        if (search) {
            filter.$text = { $search: search };
        }

        const [notifications, total] = await Promise.all([
            this.notificationModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('recipientId', 'firstName lastName email')
                .populate('senderId', 'firstName lastName email')
                .populate('branchId', 'name nameAr')
                .populate('productId', 'name nameAr')
                .populate('orderId', 'orderNumber')
                .exec(),
            this.notificationModel.countDocuments(filter),
        ]);

        return {
            data: notifications,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string): Promise<Notification> {
        const notification = await this.notificationModel
            .findById(id)
            .populate('recipientId', 'firstName lastName email')
            .populate('senderId', 'firstName lastName email')
            .populate('branchId', 'name nameAr')
            .populate('productId', 'name nameAr')
            .populate('orderId', 'orderNumber')
            .exec();

        if (!notification || notification.isDeleted) {
            throw new NotFoundException('الإشعار غير موجود');
        }

        return notification;
    }

    async findByRecipient(recipientId: string, query: NotificationQueryDto) {
        return this.findAll({ ...query, recipientId });
    }

    async getUnreadCount(recipientId: string): Promise<number> {
        return await this.notificationModel.countDocuments({
            recipientId: new Types.ObjectId(recipientId),
            isRead: false,
            isDeleted: false,
        });
    }

    async markAsRead(markReadDto: MarkReadDto, userId: string): Promise<Notification> {
        const { notificationId, userId: targetUserId } = markReadDto;
        const filter: any = { _id: notificationId, isDeleted: false };

        // If targetUserId is provided, use it; otherwise use the authenticated user
        if (targetUserId) {
            filter.recipientId = new Types.ObjectId(targetUserId);
        } else {
            filter.recipientId = new Types.ObjectId(userId);
        }

        const notification = await this.notificationModel.findOneAndUpdate(
            filter,
            {
                isRead: true,
                readAt: new Date(),
                updatedBy: userId,
            },
            { new: true }
        );

        if (!notification) {
            throw new NotFoundException('الإشعار غير موجود');
        }

        return notification;
    }

    async markAllAsRead(recipientId: string, userId: string): Promise<{ modifiedCount: number }> {
        const result = await this.notificationModel.updateMany(
            {
                recipientId: new Types.ObjectId(recipientId),
                isRead: false,
                isDeleted: false,
            },
            {
                isRead: true,
                readAt: new Date(),
                updatedBy: userId,
            }
        );

        return { modifiedCount: result.modifiedCount };
    }

    async update(id: string, updateNotificationDto: UpdateNotificationDto, userId: string): Promise<Notification> {
        const notification = await this.notificationModel.findByIdAndUpdate(
            id,
            {
                ...updateNotificationDto,
                updatedBy: userId,
            },
            { new: true }
        );

        if (!notification || notification.isDeleted) {
            throw new NotFoundException('الإشعار غير موجود');
        }

        return notification;
    }

    async remove(id: string, userId: string): Promise<void> {
        const notification = await this.notificationModel.findByIdAndUpdate(
            id,
            {
                isDeleted: true,
                updatedBy: userId,
            }
        );

        if (!notification) {
            throw new NotFoundException('الإشعار غير موجود');
        }
    }

    async getNotificationStats(recipientId?: string) {
        const filter: any = { isDeleted: false };
        if (recipientId) {
            filter.recipientId = new Types.ObjectId(recipientId);
        }

        const [total, unread, byType, byPriority] = await Promise.all([
            this.notificationModel.countDocuments(filter),
            this.notificationModel.countDocuments({ ...filter, isRead: false }),
            this.notificationModel.aggregate([
                { $match: filter },
                { $group: { _id: '$type', count: { $sum: 1 } } },
            ]),
            this.notificationModel.aggregate([
                { $match: filter },
                { $group: { _id: '$priority', count: { $sum: 1 } } },
            ]),
        ]);

        return {
            total,
            unread,
            byType: byType.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            byPriority: byPriority.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
        };
    }

    // System notification methods
    async createSystemNotification(
        title: string,
        titleAr: string,
        message: string,
        messageAr: string,
        type: string,
        recipientIds: string[],
        metadata?: Record<string, any>
    ): Promise<Notification[]> {
        const notifications = recipientIds.map(recipientId => ({
            title,
            titleAr,
            message,
            messageAr,
            type,
            recipientId: new Types.ObjectId(recipientId),
            priority: 'medium',
            channels: ['in-app'],
            metadata,
            isSent: true,
            sentAt: new Date(),
        }));

        return await this.notificationModel.insertMany(notifications) as Notification[];
    }

    async createLowStockNotification(productId: string, productName: string, currentStock: number): Promise<void> {
        // Find all managers and admins
        // This would typically come from a user service
        // For now, we'll create a placeholder notification
        const notification = new this.notificationModel({
            title: 'Low Stock Alert',
            titleAr: 'تنبيه مخزون منخفض',
            message: `Product ${productName} is running low on stock. Current stock: ${currentStock}`,
            messageAr: `المنتج ${productName} منخفض في المخزون. المخزون الحالي: ${currentStock}`,
            type: 'LOW_STOCK',
            recipientId: new Types.ObjectId(), // This should be a real user ID
            priority: 'high',
            channels: ['in-app', 'email'],
            productId: new Types.ObjectId(productId),
            metadata: { currentStock, productName },
            isSent: true,
            sentAt: new Date(),
        });

        await notification.save();
    }
}
