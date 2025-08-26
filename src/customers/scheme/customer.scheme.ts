import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CustomerDocument = Customer & Document;

@Schema({ timestamps: true })
export class Customer {
    @Prop({ required: true, trim: true })
    firstName: string;

    @Prop({ required: true, trim: true })
    lastName: string;

    @Prop({ required: true, unique: true, lowercase: true, trim: true })
    email: string;

    @Prop({ trim: true })
    phoneNumber: string;

    @Prop({ required: true, unique: true })
    customerCode: string;

    // Simple Address
    @Prop({
        type: {
            street: String,
            city: String,
            country: { type: String, default: 'Syria' },
        },
    })
    address: {
        street?: string;
        city?: string;
        country?: string;
    };

    // Purchase Statistics
    @Prop({ default: 0 })
    totalOrders: number;

    @Prop({ default: 0 })
    totalSpent: number;

    @Prop()
    lastOrderDate: Date;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ trim: true })
    notes: string;

    @Prop({ default: false })
    isDeleted: boolean;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    createdBy: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    updatedBy: Types.ObjectId;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);

// Indexes
// email and customerCode indexes are already created by @Prop({ unique: true })
CustomerSchema.index({ phoneNumber: 1 });
CustomerSchema.index({ firstName: 1, lastName: 1 });
CustomerSchema.index({ isActive: 1 });
CustomerSchema.index({ isDeleted: 1 });
CustomerSchema.index({ totalSpent: -1 });
CustomerSchema.index({ createdAt: -1 });

// Text index for search
CustomerSchema.index({
    firstName: 'text',
    lastName: 'text',
    email: 'text',
    phoneNumber: 'text',
    customerCode: 'text',
});

// Virtual for full name
CustomerSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for average order value
CustomerSchema.virtual('averageOrderValue').get(function () {
    return this.totalOrders > 0 ? this.totalSpent / this.totalOrders : 0;
});

// Pre-save middleware
CustomerSchema.pre('save', function (next) {
    if (!this.customerCode) {
        const timestamp = Date.now().toString().slice(-6);
        this.customerCode = `CUST${timestamp}`;
    }
    next();
});

// Ensure virtual fields are serialised
CustomerSchema.set('toJSON', { virtuals: true });