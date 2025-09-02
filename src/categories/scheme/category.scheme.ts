import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {

    _id: Types.ObjectId;
    @Prop({ required: true, trim: true })
    name: string;

    @Prop()
    image: string;

    @Prop({ default: 0 })
    sortOrder: number;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ default: false })
    isFeatured: boolean;

    @Prop({ default: 0 })
    productCount: number;

    @Prop({ default: false })
    isDeleted: boolean;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    createdBy: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    updatedBy: Types.ObjectId;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Indexes
CategorySchema.index({ name: 1 });
CategorySchema.index({ nameAr: 1 });
// slug index is already created by @Prop({ unique: true })
CategorySchema.index({ parentId: 1 });
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ sortOrder: 1 });
CategorySchema.index({ isFeatured: 1 });
CategorySchema.index({ isDeleted: 1 });

// Text index for search
CategorySchema.index({
    name: 'text',
    nameAr: 'text',
    description: 'text',
    descriptionAr: 'text',
});







// Ensure virtual fields are serialised
CategorySchema.set('toJSON', { virtuals: true });