import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/users/scheme/user.scheme';

export type MerchantDocument = Merchant & Document;

@Schema({ timestamps: true })
export class Merchant {
    _id: Types.ObjectId;

    @Prop({ required: true, trim: true })
    storeName: string;

    @Prop({ required: true, trim: true })
    address: string;

    @Prop({ required: true, trim: true })
    phoneNumber: string;


    @Prop({ type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' })
    status: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ trim: true })
    rejectionReason?: string;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    reviewedBy?: Types.ObjectId;

    @Prop()
    reviewedAt?: Date;

    @Prop({ default: false })
    isDeleted: boolean;


    user?: User;
    reviewer?: User;
}

export const MerchantSchema = SchemaFactory.createForClass(Merchant);

// Additional indexes
MerchantSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true,
});
MerchantSchema.virtual('reviewer', {
    ref: 'User',
    localField: 'reviewedBy',
    foreignField: '_id',
    justOne: true,
});

MerchantSchema.index({ status: 1 });
MerchantSchema.index({ userId: 1 });
MerchantSchema.index({ isDeleted: 1 });
MerchantSchema.index({ createdAt: -1 });

MerchantSchema.set('toJSON', { virtuals: true });
