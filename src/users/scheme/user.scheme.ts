import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Branch } from 'src/branches/scheme/branche.scheme';
import { UserRole } from 'src/common/enums';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {

    _id: Types.ObjectId;
    @Prop({ required: true, trim: true })
    firstName: string;

    @Prop({ required: true, trim: true })
    lastName: string;

    @Prop({ required: false, unique: true, sparse: true, lowercase: true, trim: true })
    email: string;

    @Prop({ required: true, select: false })
    password: string;

    @Prop()
    fcmToken: string;

    @Prop({ type: String, enum: UserRole, default: UserRole.CUSTOMER })
    role: UserRole;

    @Prop({ default: 0, min: 0 })
    points: number; // النقاط المتاحة (موحدة لكل العملات)

    @Prop({ default: 0, min: 0 })
    totalPointsEarned: number; // إجمالي النقاط المكتسبة

    @Prop({ default: 0, min: 0 })
    totalPointsUsed: number; // إجمالي النقاط المستخدمة

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ required: true, unique: true, trim: true })
    phoneNumber: string;

    @Prop()
    profileImage: string;

    @Prop({ type: Types.ObjectId, ref: 'Branch' })
    branchId: Types.ObjectId;

    @Prop()
    lastLoginAt: Date;


    @Prop({ default: false })
    isDeleted: boolean;

    fullName: string;

    branch?: Branch;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Additional indexes (excluding unique indexes that are already created by @Prop)
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ isDeleted: 1 });

// Virtual for full name
UserSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

UserSchema.virtual("branch", {
    justOne: true,
    localField: "branchId",
    foreignField: "_id",
    ref: "Branch"
});
// Remove sensitive data when converting to JSON
UserSchema.methods.toJSON = function () {
    const userObject = this.toObject({ virtuals: true });
    delete userObject.password;
    return userObject;
};

UserSchema.set('toJSON', { virtuals: true });