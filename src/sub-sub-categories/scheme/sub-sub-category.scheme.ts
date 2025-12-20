import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubSubCategoryDocument = SubSubCategory & Document;

@Schema({ timestamps: true })
export class SubSubCategory {
    _id: Types.ObjectId;

    @Prop({ required: true, trim: true })
    name: string;

    @Prop()
    image: string;

    @Prop({ type: Types.ObjectId, ref: 'SubCategory', required: true })
    subCategoryId: Types.ObjectId; // Parent sub-category

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ default: false })
    isDeleted: boolean;
}

export const SubSubCategorySchema = SchemaFactory.createForClass(SubSubCategory);

// Basic indexes
SubSubCategorySchema.index({ name: 1 });
SubSubCategorySchema.index({ subCategoryId: 1 });
SubSubCategorySchema.index({ isActive: 1 });
SubSubCategorySchema.index({ isDeleted: 1 });

// Ensure virtual fields are serialised
SubSubCategorySchema.set('toJSON', { virtuals: true });

