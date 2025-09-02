import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ProductStatus } from 'src/common/enums';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ required: true, trim: true })
    nameAr: string;

    @Prop({ trim: true })
    description: string;

    @Prop({ trim: true })
    descriptionAr: string;

    @Prop({ required: true, unique: true })
    sku: string; // Stock Keeping Unit

    @Prop({ required: true, unique: true })
    slug: string;

    @Prop()
    barcode: string;

    @Prop({ required: true })
    price: number;

    @Prop({ required: true })
    costPrice: number;

    @Prop()
    salePrice: number; // Price when on sale

    @Prop({ default: 'SYP' })
    currency: string;

    @Prop({ required: true, default: 0 })
    stockQuantity: number;

    @Prop({ default: 5 })
    minStockLevel: number; // Alert when stock is low

    @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
    categoryId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'SubCategory', required: true })
    subCategoryId: Types.ObjectId;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'Category' }], default: [] })
    additionalCategories: Types.ObjectId[];

    @Prop({ type: [String], default: [] })
    images: string[];

    @Prop()
    mainImage: string;

    @Prop({ trim: true })
    brand: string;


    // list of branches that the product is available in
    @Prop({ type: [{ type: Types.ObjectId, ref: 'Branch' }], default: [] })
    branches: Types.ObjectId[];

    @Prop({ trim: true })
    model: string;

    @Prop({ default: 0 })
    weight: number; // in grams

    @Prop({
        type: {
            length: Number,
            width: Number,
            height: Number,
        },
    })
    dimensions: {
        length?: number;
        width?: number;
        height?: number;
    };

    @Prop({ type: String, enum: ProductStatus, default: ProductStatus.ACTIVE })
    status: ProductStatus;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ default: false })
    isFeatured: boolean;

    @Prop({ default: false })
    isOnSale: boolean;

    @Prop({ type: [String], default: [] })
    tags: string[];

    // SEO fields
    @Prop()
    metaTitle: string;

    @Prop()
    metaDescription: string;

    @Prop({ type: [String], default: [] })
    keywords: string[];

    // Sales data
    @Prop({ default: 0 })
    totalSales: number;

    @Prop({ default: 0 })
    viewCount: number;

    @Prop({ default: 0 })
    rating: number; // Average rating (0-5)

    @Prop({ default: 0 })
    reviewCount: number;

    @Prop({ default: 0 })
    sortOrder: number;

    @Prop({ default: false })
    isDeleted: boolean;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    createdBy: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    updatedBy: Types.ObjectId;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Indexes
ProductSchema.index({ name: 1 });
ProductSchema.index({ nameAr: 1 });
// sku and slug indexes are already created by @Prop({ unique: true })
ProductSchema.index({ barcode: 1 });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ subCategoryId: 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ isFeatured: 1 });
ProductSchema.index({ isOnSale: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ stockQuantity: 1 });
ProductSchema.index({ rating: 1 });
ProductSchema.index({ totalSales: -1 });
ProductSchema.index({ viewCount: -1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ isDeleted: 1 });

// Compound indexes
ProductSchema.index({ categoryId: 1, subCategoryId: 1, isActive: 1, isDeleted: 1 });
ProductSchema.index({ isActive: 1, isFeatured: 1, isDeleted: 1 });
ProductSchema.index({ price: 1, categoryId: 1, subCategoryId: 1 });
ProductSchema.index({ brand: 1, categoryId: 1, subCategoryId: 1 });

// Text index for search
ProductSchema.index({
    name: 'text',
    nameAr: 'text',
    description: 'text',
    descriptionAr: 'text',
    sku: 'text',
    brand: 'text',
    tags: 'text',
});

// Virtual for profit margin
ProductSchema.virtual('profitMargin').get(function () {
    if (this.costPrice > 0) {
        return ((this.price - this.costPrice) / this.costPrice) * 100;
    }
    return 0;
});

// Virtual for effective price (sale price or regular price)
ProductSchema.virtual('effectivePrice').get(function () {
    return this.isOnSale && this.salePrice ? this.salePrice : this.price;
});

// Virtual for discount percentage
ProductSchema.virtual('discountPercentage').get(function () {
    if (this.isOnSale && this.salePrice && this.salePrice < this.price) {
        return ((this.price - this.salePrice) / this.price) * 100;
    }
    return 0;
});

// Virtual for stock status
ProductSchema.virtual('stockStatus').get(function () {
    if (this.stockQuantity <= 0) return 'out_of_stock';
    if (this.stockQuantity <= this.minStockLevel) return 'low_stock';
    return 'in_stock';
});

// Pre-save middleware
ProductSchema.pre('save', function (next) {
    // Generate SKU if not provided
    if (!this.sku) {
        this.sku = `PRD-${Date.now()}`;
    }

    // Generate slug if not provided
    if (this.isModified('name') && !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }

    // Set main image from images array if not set
    if (!this.mainImage && this.images.length > 0) {
        this.mainImage = this.images[0];
    }

    next();
});

// Ensure virtual fields are serialised
ProductSchema.set('toJSON', { virtuals: true });