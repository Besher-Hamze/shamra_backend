import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { ProductStatus } from 'src/common/enums';
import { Category } from 'src/categories/scheme/category.scheme';
import { SubCategory } from 'src/sub-categories/scheme/sub-category.scheme';
import { SubSubCategory } from 'src/sub-sub-categories/scheme/sub-sub-category.scheme';
import { Branch } from 'src/branches/scheme/branche.scheme';

// Branch pricing schema for individual branch pricing
@Schema({ _id: false })
export class BranchPricing {
    @Prop({ type: Types.ObjectId, ref: 'Branch', required: true })
    branchId: Types.ObjectId;

    @Prop({ required: true })
    price: number;

    @Prop({ required: true })
    costPrice: number;

    @Prop({ required: true })
    wholeSalePrice: number;

    @Prop()
    salePrice: number; // Price when on sale

    @Prop({ default: 'SYP' })
    currency: string;

    @Prop({ required: true, default: 0 })
    stockQuantity: number;

    @Prop({ required: true, unique: true })
    sku: string;

    @Prop({ default: false })
    isOnSale: boolean;

    @Prop({ default: true })
    isActive: boolean; // Whether this pricing is active for this branch
}

// Forward declaration to avoid circular reference
export type ProductDocument = Product & Document;

// Interface for Product methods
export interface ProductMethods {
    getBranchEffectivePrice(branchId: Types.ObjectId): number;
    getBranchProfitMargin(branchId: Types.ObjectId): number;
    getBranchDiscountPercentage(branchId: Types.ObjectId): number;
    getBranchStockQuantity(branchId: Types.ObjectId): number;
    setBranchPricing(branchId: Types.ObjectId, pricing: Partial<BranchPricing>): Promise<ProductDocument>;
    removeBranchPricing(branchId: Types.ObjectId): Promise<ProductDocument>;
    getActiveBranchPricing(): BranchPricing[];
}

// Extended type with methods
export type ProductDocumentWithMethods = ProductDocument & ProductMethods;

@Schema({ timestamps: true })
export class Product {
    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ trim: true })
    description: string;

    @Prop({ type: Map, of: mongoose.Schema.Types.Mixed })
    specifications: Map<string, any>;

    @Prop()
    barcode: string;

    // Branch-specific pricing and stock information
    @Prop({ type: [BranchPricing], default: [] })
    branchPricing: BranchPricing[];

    @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
    categoryId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'SubCategory', required: true })
    subCategoryId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'SubSubCategory' })
    subSubCategoryId: Types.ObjectId;

    @Prop({ type: [String], default: [] })
    images: string[];

    @Prop()
    mainImage: string;

    @Prop({ trim: true })
    brand: string;

    // list of branches that the product is available in
    @Prop({ type: [{ type: Types.ObjectId, ref: 'Branch' }], default: [] })
    branches: Types.ObjectId[];

    @Prop({ type: String, enum: ProductStatus, default: ProductStatus.ACTIVE })
    status: ProductStatus;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ default: false })
    isFeatured: boolean;

    @Prop({ type: [String], default: [] })
    tags: string[];

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

    // Virtual fields (populated data)
    category?: Category;
    subCategory?: SubCategory;
    subSubCategory?: SubSubCategory;
    branchDetails: Branch[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Indexes
ProductSchema.index({ name: 1 });
ProductSchema.index({ barcode: 1 });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ subCategoryId: 1 });
ProductSchema.index({ subSubCategoryId: 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ isFeatured: 1 });
ProductSchema.index({ isOnSale: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ stockQuantity: 1 });
ProductSchema.index({ 'branchPricing.branchId': 1 });
ProductSchema.index({ 'branchPricing.price': 1 });
ProductSchema.index({ 'branchPricing.stockQuantity': 1 });
ProductSchema.index({ 'branchPricing.isActive': 1 });
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
ProductSchema.index({ 'branchPricing.branchId': 1, 'branchPricing.isActive': 1 });
ProductSchema.index({ 'branchPricing.branchId': 1, categoryId: 1, subCategoryId: 1 });
ProductSchema.index({ categoryId: 1, subCategoryId: 1, subSubCategoryId: 1 });

// Text index for search
ProductSchema.index({
    name: 'text',
    description: 'text',
    brand: 'text',
    tags: 'text',
});


// Method to get profit margin for specific branch
ProductSchema.methods.getBranchProfitMargin = function (branchId: Types.ObjectId) {
    const branchPricing = this.branchPricing.find(
        (bp: BranchPricing) => bp.branchId.toString() === branchId.toString()
    );

    if (branchPricing && branchPricing.costPrice > 0) {
        return ((branchPricing.price - branchPricing.costPrice) / branchPricing.costPrice) * 100;
    }

    // Fallback to global pricing
    if (this.costPrice > 0) {
        return ((this.price - this.costPrice) / this.costPrice) * 100;
    }

    return 0;
};



// Method to get effective price for specific branch
ProductSchema.methods.getBranchEffectivePrice = function (branchId: Types.ObjectId) {
    const branchPricing = this.branchPricing.find(
        (bp: BranchPricing) => bp.branchId.toString() === branchId.toString()
    );

    if (branchPricing) {
        return branchPricing.isOnSale && branchPricing.salePrice ? branchPricing.salePrice : branchPricing.price;
    }

    // Fallback to global pricing
    return this.isOnSale && this.salePrice ? this.salePrice : this.price;
};


// Method to get discount percentage for specific branch
ProductSchema.methods.getBranchDiscountPercentage = function (branchId: Types.ObjectId) {
    const branchPricing = this.branchPricing.find(
        (bp: BranchPricing) => bp.branchId.toString() === branchId.toString()
    );

    if (branchPricing && branchPricing.isOnSale && branchPricing.salePrice && branchPricing.salePrice < branchPricing.price) {
        return ((branchPricing.price - branchPricing.salePrice) / branchPricing.price) * 100;
    }

    // Fallback to global pricing
    if (this.isOnSale && this.salePrice && this.salePrice < this.price) {
        return ((this.price - this.salePrice) / this.price) * 100;
    }

    return 0;
};

// Method to get stock quantity for specific branch
ProductSchema.methods.getBranchStockQuantity = function (branchId: Types.ObjectId) {
    const branchPricing = this.branchPricing.find(
        (bp: BranchPricing) => bp.branchId.toString() === branchId.toString()
    );

    if (branchPricing) {
        return branchPricing.stockQuantity;
    }

    // Fallback to global stock
    return this.stockQuantity;
};

// Method to add or update branch pricing
ProductSchema.methods.setBranchPricing = function (branchId: Types.ObjectId, pricing: Partial<BranchPricing>) {
    const existingIndex = this.branchPricing.findIndex(
        (bp: BranchPricing) => bp.branchId.toString() === branchId.toString()
    );

    const branchPricingData = {
        branchId,
        price: pricing.price || this.price,
        costPrice: pricing.costPrice || this.costPrice,
        wholeSalePrice: pricing.wholeSalePrice || this.wholeSalePrice,
        salePrice: pricing.salePrice,
        currency: pricing.currency || this.currency,
        stockQuantity: pricing.stockQuantity || 0,
        isOnSale: pricing.isOnSale || false,
        isActive: pricing.isActive !== undefined ? pricing.isActive : true,
    };

    if (existingIndex >= 0) {
        this.branchPricing[existingIndex] = branchPricingData;
    } else {
        this.branchPricing.push(branchPricingData);
    }

    return this.save();
};

// Method to remove branch pricing
ProductSchema.methods.removeBranchPricing = function (branchId: Types.ObjectId) {
    this.branchPricing = this.branchPricing.filter(
        (bp: BranchPricing) => bp.branchId.toString() !== branchId.toString()
    );
    return this.save();
};

// Method to get all active branch pricing
ProductSchema.methods.getActiveBranchPricing = function () {
    return this.branchPricing.filter((bp: BranchPricing) => bp.isActive);
};


// Virtual for populated category
ProductSchema.virtual('category', {
    ref: 'Category',
    localField: 'categoryId',
    foreignField: '_id',
    justOne: true
});

// Virtual for populated subcategory
ProductSchema.virtual('subCategory', {
    ref: 'SubCategory',
    localField: 'subCategoryId',
    foreignField: '_id',
    justOne: true
});

// Virtual for populated sub subcategory
ProductSchema.virtual('subSubCategory', {
    ref: 'SubSubCategory',
    localField: 'subSubCategoryId',
    foreignField: '_id',
    justOne: true
});

// Virtual for populated branch details
ProductSchema.virtual('branchDetails', {
    ref: 'Branch',
    localField: 'branches',
    foreignField: '_id',
    justOne: false
});

// Pre-save middleware
ProductSchema.pre('save', function (next) {
    // Set main image from images array if not set
    if (!this.mainImage && this.images.length > 0) {
        this.mainImage = this.images[0];
    }

    next();
});

// Ensure virtual fields are serialised
ProductSchema.set('toJSON', { virtuals: true });