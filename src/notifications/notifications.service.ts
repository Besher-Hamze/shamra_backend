import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Notification, NotificationDocument } from './scheme/notification.scheme';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { BulkNotificationDto } from './dto/bulk-notification.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

import * as admin from 'firebase-admin';

// ✅ Initialize Firebase Admin once
admin.initializeApp({
  credential: admin.credential.cert(
    require('../../firebase-service-account.json'), // تأكد أن المسار صحيح
  ),
});

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
  ) { }

  /**
   * 🔹 Internal: Send push notification via FCM
   */
  private async sendPushNotification(
    tokensOrTopic: string | string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    try {
      if (Array.isArray(tokensOrTopic)) {
        await admin.messaging().sendEachForMulticast({
          tokens: tokensOrTopic,
          notification: { title, body },
          data,
        });
      } else if (tokensOrTopic.startsWith('/topics/')) {
        await admin.messaging().send({
          topic: tokensOrTopic.replace('/topics/', ''),
          notification: { title, body },
          data,
        });
      } else {
        await admin.messaging().send({
          token: tokensOrTopic,
          notification: { title, body },
          data,
        });
      }
    } catch (error) {
      console.error('❌ Error sending FCM:', error);
    }
  }

  /**
   * 🔹 Create notification for one user + send push
   */
  async create(createNotificationDto: CreateNotificationDto, userId: string): Promise<Notification> {
    const notification = new this.notificationModel({
      ...createNotificationDto,
      recipientId: userId,
      createdBy: userId,
      updatedBy: userId,
    });

    const saved = await notification.save();

    if (createNotificationDto.fcmToken) {
      await this.sendPushNotification(
        createNotificationDto.fcmToken,
        createNotificationDto.title,
        createNotificationDto.message,
        { type: createNotificationDto.type ?? 'GENERAL' },
      );
    }

    return saved;
  }

  /**
   * 🔹 Bulk create + send push
   */
  async createBulk(bulkNotificationDto: BulkNotificationDto, userId: string): Promise<Notification[]> {
    const notifications = bulkNotificationDto.recipientIds.map(recipientId => ({
      ...bulkNotificationDto,
      recipientId,
      createdBy: userId,
      updatedBy: userId,
    }));

    const saved = (await this.notificationModel.insertMany(notifications)) as any[];

    if (bulkNotificationDto.fcmTokens?.length) {
      await this.sendPushNotification(
        bulkNotificationDto.fcmTokens,
        bulkNotificationDto.title,
        bulkNotificationDto.message,
        { type: bulkNotificationDto.type ?? 'GENERAL' },
      );
    }

    return saved;
  }

  /**
   * 🔹 Send broadcast notification to all users (topic shamra)
   */
  async notifyAll(title: string, message: string, data?: Record<string, string>) {
    await this.sendPushNotification('/topics/shamra', title, message, data);

    // const notification = new this.notificationModel({
    //   title,
    //   message,
    //   type: 'BROADCAST',
    //   priority: 'high',
    //   channels: ['in-app', 'push'],
    //   isSent: true,
    //   sentAt: new Date(),
    // });

    // await notification.save();
    return { success: true };
  }

  /**
   * 🔹 Find all notifications with filters + pagination
   */
  async findAll(query: NotificationQueryDto, userId?: string) {
    const { page = 1, limit = 20, recipientId, type, branchId, isRead, priority, search } = query;
    const skip = (page - 1) * limit;

    const filter: any = { isDeleted: false };

    if (recipientId) filter.recipientId = new Types.ObjectId(recipientId);
    if (type) filter.type = type;
    if (branchId) filter.branchId = new Types.ObjectId(branchId);
    if (isRead !== undefined) filter.isRead = isRead;
    if (priority) filter.priority = priority;
    if (!recipientId && userId) filter.recipientId = new Types.ObjectId(userId);
    if (search) filter.$text = { $search: search };

    const [notifications, total] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.notificationModel.countDocuments(filter),
    ]);

    return {
      data: notifications,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async findAllForAdmin(query: NotificationQueryDto) {
    const { page = 1, limit = 20, recipientId, type, branchId, isRead, priority, search } = query;
    const skip = (page - 1) * limit;
    const filter: any = { isDeleted: false };
    if (recipientId) filter.recipientId = new Types.ObjectId(recipientId);
    if (type) filter.type = type;
    if (branchId) filter.branchId = new Types.ObjectId(branchId);
    if (isRead !== undefined) filter.isRead = isRead;
    if (priority) filter.priority = priority;
    if (search) filter.$text = { $search: search };
    const [notifications, total] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.notificationModel.countDocuments(filter),
    ]);
    return {
      data: notifications,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * 🔹 Find one notification by ID
   */
  async findOne(id: string): Promise<Notification> {
    const notification = await this.notificationModel.findById(id).exec();
    if (!notification || notification.isDeleted) {
      throw new NotFoundException('الإشعار غير موجود');
    }
    return notification;
  }

  /**
   * 🔹 Mark one notification as read
   */
  async markAsRead(markReadDto: MarkReadDto, userId: string): Promise<Notification> {
    const { notificationId, userId: targetUserId } = markReadDto;
    const filter: any = { _id: notificationId, isDeleted: false };

    filter.recipientId = new Types.ObjectId(targetUserId ?? userId);

    const notification = await this.notificationModel.findOneAndUpdate(
      filter,
      { isRead: true, readAt: new Date(), updatedBy: userId },
      { new: true },
    );

    if (!notification) {
      throw new NotFoundException('الإشعار غير موجود');
    }

    return notification;
  }

  /**
   * 🔹 Mark all notifications as read for a user
   */
  async markAllAsRead(recipientId: string, userId: string) {
    const result = await this.notificationModel.updateMany(
      { recipientId: new Types.ObjectId(recipientId), isRead: false, isDeleted: false },
      { isRead: true, readAt: new Date(), updatedBy: userId },
    );
    return { modifiedCount: result.modifiedCount };
  }

  /**
   * 🔹 Update a notification
   */
  async update(id: string, updateNotificationDto: UpdateNotificationDto, userId: string): Promise<Notification> {
    const notification = await this.notificationModel.findByIdAndUpdate(
      id,
      { ...updateNotificationDto, updatedBy: userId },
      { new: true },
    );
    if (!notification || notification.isDeleted) {
      throw new NotFoundException('الإشعار غير موجود');
    }
    return notification;
  }

  /**
   * 🔹 Soft delete a notification
   */
  async remove(id: string, userId: string) {
    const notification = await this.notificationModel.findByIdAndUpdate(
      id,
      { isDeleted: true, updatedBy: userId },
    );
    if (!notification) {
      throw new NotFoundException('الإشعار غير موجود');
    }
  }

  /**
   * 🔹 Stats summary
   */
  async getNotificationStats(recipientId?: string) {
    const filter: any = { isDeleted: false };
    if (recipientId) filter.recipientId = new Types.ObjectId(recipientId);

    const [total, unread] = await Promise.all([
      this.notificationModel.countDocuments(filter),
      this.notificationModel.countDocuments({ ...filter, isRead: false }),
    ]);

    return { total, unread };
  }
}
