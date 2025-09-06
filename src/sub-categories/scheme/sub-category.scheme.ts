import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SubCategoryType } from 'src/common/enums';

export type SubCategoryDocument = SubCategory & Document;

@Schema({ timestamps: true })
export class SubCategory {
    _id: Types.ObjectId;

    @Prop({ required: true, trim: true })
    name: string;

    @Prop()
    image: string;

    @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
    categoryId: Types.ObjectId; // Parent category

    @Prop({ type: String, enum: SubCategoryType, default: SubCategoryType.FREE_ATTR })
    type: SubCategoryType;

    @Prop({ type: [String], default: [] })
    customFields: string[]; // Custom field names when type is CUSTOM_ATTR

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ default: false })
    isDeleted: boolean;
}

export const SubCategorySchema = SchemaFactory.createForClass(SubCategory);

// Basic indexes
SubCategorySchema.index({ name: 1 });
SubCategorySchema.index({ categoryId: 1 });
SubCategorySchema.index({ type: 1 });
SubCategorySchema.index({ isActive: 1 });
SubCategorySchema.index({ isDeleted: 1 });

// Ensure virtual fields are serialised
SubCategorySchema.set('toJSON', { virtuals: true });
