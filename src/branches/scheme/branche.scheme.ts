import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BranchDocument = Branch & Document;

@Schema({ timestamps: true })
export class Branch {
    _id: Types.ObjectId;
    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ required: true, trim: true })
    nameAr: string;

    @Prop({ trim: true })
    description: string;

    @Prop({ trim: true })
    descriptionAr: string;

    @Prop({ required: true, unique: true })
    code: string; // Branch code (e.g., BR001, BR002)

    @Prop({ trim: true })
    phone: string;

    @Prop({ trim: true })
    email: string;

    @Prop({ trim: true })
    website: string;

    // Address Information
    @Prop({
        type: {
            street: { type: String, trim: true },
            city: { type: String, trim: true },
            state: { type: String, trim: true },
            zipCode: { type: String, trim: true },
            country: { type: String, trim: true, default: 'Syria' },
            coordinates: {
                lat: { type: Number },
                lng: { type: Number },
            },
        },
        required: true,
    })
    address: {
        street: string;
        city: string;
        state?: string;
        zipCode?: string;
        country?: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };

    @Prop({ type: Types.ObjectId, ref: 'User' })
    managerId: Types.ObjectId; // Branch Manager

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ default: false })
    isMainBranch: boolean; // Main/Head office

    // Operating Hours
    @Prop({
        type: {
            monday: { open: String, close: String },
            tuesday: { open: String, close: String },
            wednesday: { open: String, close: String },
            thursday: { open: String, close: String },
            friday: { open: String, close: String },
            saturday: { open: String, close: String },
            sunday: { open: String, close: String },
        },
        default: {},
    })
    operatingHours: {
        monday?: { open: string; close: string };
        tuesday?: { open: string; close: string };
        wednesday?: { open: string; close: string };
        thursday?: { open: string; close: string };
        friday?: { open: string; close: string };
        saturday?: { open: string; close: string };
        sunday?: { open: string; close: string };
    };

    // Statistics
    @Prop({ default: 0 })
    employeeCount: number;

    @Prop({ default: 0 })
    totalSales: number;

    @Prop({ default: 0 })
    totalOrders: number;

    @Prop({ default: 0 })
    sortOrder: number;

    @Prop({ default: false })
    isDeleted: boolean;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    createdBy: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    updatedBy: Types.ObjectId;
}

export const BranchSchema = SchemaFactory.createForClass(Branch);

// Indexes
BranchSchema.index({ name: 1 });
BranchSchema.index({ nameAr: 1 });
// code index is already created by @Prop({ unique: true })
BranchSchema.index({ isActive: 1 });
BranchSchema.index({ isMainBranch: 1 });
BranchSchema.index({ managerId: 1 });
BranchSchema.index({ 'address.city': 1 });
BranchSchema.index({ sortOrder: 1 });
BranchSchema.index({ isDeleted: 1 });

// Text index for search
BranchSchema.index({
    name: 'text',
    nameAr: 'text',
    description: 'text',
    descriptionAr: 'text',
    code: 'text',
});

// Virtual for full address
BranchSchema.virtual('fullAddress').get(function () {
    const addr = this.address;
    if (!addr) return '';

    const parts = [addr.street, addr.city, addr.state, addr.country].filter(Boolean);
    return parts.join(', ');
});

// Virtual for current status
BranchSchema.virtual('currentStatus').get(function () {
    if (!this.isActive) return 'inactive';
    if (this.isDeleted) return 'deleted';
    return 'active';
});

// Pre-save middleware
BranchSchema.pre('save', function (next) {
    // Generate code if not provided
    if (!this.code) {
        this.code = `BR${Date.now().toString().slice(-6)}`;
    }

    next();
});

// Ensure virtual fields are serialised
BranchSchema.set('toJSON', { virtuals: true });