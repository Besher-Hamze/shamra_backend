import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { NotificationType } from 'src/common/enums';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
    @Prop({ required: true, trim: true })
    title: string;

    @Prop({ required: true, trim: true })
    message: string;

    @Prop({ type: String, enum: NotificationType, default:NotificationType.SYSTEM })
    type: NotificationType;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    recipientId: Types.ObjectId;

    @Prop()
    fcmToken?:string
    @Prop({ type: Types.ObjectId, ref: 'Branch' })
    branchId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Product' })
    productId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Order' })
    orderId: Types.ObjectId;

    @Prop({ default: false })
    isRead: boolean;

    @Prop()
    readAt: Date;

    @Prop({ default: false })
    isDeleted: boolean;

    @Prop({ default: 'info' })
    priority: 'low' | 'medium' | 'high' | 'urgent';

    @Prop({ type: [String], default: [] })
    channels: string[]; // email, sms, push, in-app

    @Prop({ default: false })
    isSent: boolean;

    @Prop()
    sentAt: Date;

    @Prop({ type: Object, default: {} })
    metadata: Record<string, any>;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    createdBy: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    updatedBy: Types.ObjectId;

    @Prop({ default: Date.now })
    createdAt: Date;

    @Prop({ default: Date.now })
    updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Indexes
NotificationSchema.index({ recipientId: 1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ isRead: 1 });
NotificationSchema.index({ isDeleted: 1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ priority: 1 });
NotificationSchema.index({ branchId: 1 });

// Compound indexes
NotificationSchema.index({ recipientId: 1, isRead: 1 });
NotificationSchema.index({ recipientId: 1, type: 1 });
NotificationSchema.index({ branchId: 1, type: 1 });

// Text index for search
NotificationSchema.index({
    title: 'text',
    titleAr: 'text',
    message: 'text',
    messageAr: 'text',
});

// Virtual for notification age
NotificationSchema.virtual('age').get(function () {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - this.createdAt.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} weeks ago`;
});

// Pre-save middleware
NotificationSchema.pre('save', function (next) {
    // Set sentAt when notification is sent
    if (this.isModified('isSent') && this.isSent && !this.sentAt) {
        this.sentAt = new Date();
    }

    // Set readAt when notification is read
    if (this.isModified('isRead') && this.isRead && !this.readAt) {
        this.readAt = new Date();
    }

    next();
});

// Ensure virtual fields are serialised
NotificationSchema.set('toJSON', { virtuals: true });
