import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Product } from 'src/products/scheme/product.schem';
import { Category } from 'src/categories/scheme/category.scheme';
import { SubCategory } from 'src/sub-categories/scheme/sub-category.scheme';

export type BannerDocument = Banner & Document;

@Schema({ timestamps: true })
export class Banner {
    _id: Types.ObjectId;

    @Prop({ required: true })
    image: string;

    // One of these three will be required
    @Prop({ type: Types.ObjectId, ref: 'Product' })
    productId?: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Category' })
    categoryId?: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'SubCategory' })
    subCategoryId?: Types.ObjectId;

    @Prop({ default: 0 })
    sortOrder: number;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ default: false })
    isDeleted: boolean;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    createdBy: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    updatedBy: Types.ObjectId;

    // Virtual fields for populated relationships
    product?: Product;
    category?: Category;
    subCategory?: SubCategory;
}

export const BannerSchema = SchemaFactory.createForClass(Banner);

// Indexes
BannerSchema.index({ productId: 1 });
BannerSchema.index({ categoryId: 1 });
BannerSchema.index({ subCategoryId: 1 });
BannerSchema.index({ isActive: 1 });
BannerSchema.index({ sortOrder: 1 });
BannerSchema.index({ isDeleted: 1 });
BannerSchema.index({ createdAt: -1 });

// Virtuals for populated relationships
BannerSchema.virtual('product', {
    ref: 'Product',
    localField: 'productId',
    foreignField: '_id',
    justOne: true
});

BannerSchema.virtual('category', {
    ref: 'Category',
    localField: 'categoryId',
    foreignField: '_id',
    justOne: true
});

BannerSchema.virtual('subCategory', {
    ref: 'SubCategory',
    localField: 'subCategoryId',
    foreignField: '_id',
    justOne: true
});

// Ensure virtual fields are serialised
BannerSchema.set('toJSON', { virtuals: true });
