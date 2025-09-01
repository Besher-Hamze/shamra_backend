import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubCategoryDocument = SubCategory & Document;

@Schema({ timestamps: true })
export class SubCategory {
    _id: Types.ObjectId;

    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ required: true, trim: true })
    nameAr: string;

    @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
    categoryId: Types.ObjectId; // Parent category

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ default: false })
    isDeleted: boolean;
}

export const SubCategorySchema = SchemaFactory.createForClass(SubCategory);

// Basic indexes
SubCategorySchema.index({ name: 1 });
SubCategorySchema.index({ categoryId: 1 });
SubCategorySchema.index({ isActive: 1 });
SubCategorySchema.index({ isDeleted: 1 });

// Ensure virtual fields are serialised
SubCategorySchema.set('toJSON', { virtuals: true });
