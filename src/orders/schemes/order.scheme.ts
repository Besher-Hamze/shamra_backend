import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Branch } from 'src/branches/scheme/branche.scheme';
import { CurrencyEnum, OrderStatus } from 'src/common/enums';
import { User } from 'src/users/scheme/user.scheme';

// Order Item Schema
@Schema({ _id: false })
export class OrderItem {
    @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
    productId: Types.ObjectId;

    @Prop({ required: true })
    productName: string;

    @Prop({ required: true, min: 1 })
    quantity: number;

    @Prop({ required: true, min: 0 })
    price: number;

    @Prop({ required: true, min: 0 })
    total: number; // quantity * price
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {
    @Prop({ required: true, unique: true })
    orderNumber: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Branch' })
    branchId: Types.ObjectId;

    @Prop({ type: [OrderItemSchema], required: true })
    items: OrderItem[];

    @Prop({ required: true, min: 0 })
    subtotal: number; // Sum of all items

    @Prop({ default: 0, min: 0 })
    taxAmount: number;

    @Prop({ default: 0, min: 0 })
    discountAmount: number;

    @Prop({ required: true, min: 0 })
    totalAmount: number; // subtotal + tax - discount

    @Prop({ type: String, enum: OrderStatus, default: OrderStatus.PENDING })
    status: OrderStatus;

    @Prop({enum:CurrencyEnum,default:CurrencyEnum.USD})
    currency:string;

    @Prop({ trim: true })
    notes: string;

    @Prop({ default: false })
    isPaid: boolean;

    @Prop()
    paidAt: Date;

    @Prop({ default: false })
    isDeleted: boolean;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    createdBy: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    updatedBy: Types.ObjectId;


    branch?: Branch;

    user?: User;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Indexes
// orderNumber index is already created by @Prop({ unique: true })
OrderSchema.index({ customerId: 1 });
OrderSchema.index({ branchId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ isPaid: 1 });
OrderSchema.index({ isDeleted: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ totalAmount: -1 });

// Compound indexes
OrderSchema.index({ customerId: 1, status: 1 });
OrderSchema.index({ branchId: 1, status: 1 });
OrderSchema.index({ status: 1, createdAt: -1 });

// Virtual for item count
// OrderSchema.virtual('itemCount').get(function () {
//     return this.items.length;
// });

// Virtual for branch
OrderSchema.virtual('branch', {
    ref: 'Branch',
    localField: 'branchId',
    foreignField: '_id',
    justOne: true
})

// Virtual for user
OrderSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
})
// Virtual for total quantity
OrderSchema.virtual('totalQuantity').get(function () {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Pre-save middleware
OrderSchema.pre('save', function (next) {
    // Generate order number if not provided
    if (!this.orderNumber) {
        const timestamp = Date.now().toString().slice(-8);
        this.orderNumber = `ORD${timestamp}`;
    }

    // Calculate totals
    this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
    this.totalAmount = this.subtotal + this.taxAmount - this.discountAmount;

    next();
});

// Ensure virtual fields are serialised
OrderSchema.set('toJSON', { virtuals: true });