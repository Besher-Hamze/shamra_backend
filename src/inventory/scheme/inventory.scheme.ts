import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { InventoryTransactionType } from 'src/common/enums';

export type InventoryDocument = Inventory & Document;
export type InventoryTransactionDocument = InventoryTransaction & Document;

// Inventory Item Schema
@Schema({ _id: false })
export class InventoryItem {
    @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
    productId: Types.ObjectId;

    @Prop({ required: true })
    productName: string;

    @Prop({ required: true })
    productSku: string;

    @Prop({ required: true, min: 0 })
    currentStock: number;

    @Prop({ required: true, min: 0 })
    reservedStock: number; // Stock reserved for orders

    @Prop({ required: true, min: 0 })
    availableStock: number; // currentStock - reservedStock

    @Prop({ required: true, min: 0 })
    minStockLevel: number;

    @Prop({ required: true, min: 0 })
    maxStockLevel: number;

    @Prop({ default: 0 })
    reorderPoint: number;

    @Prop({ default: 0 })
    reorderQuantity: number;

    @Prop({ default: 'SYP' })
    unitCost: number;

    @Prop({ default: 'SYP' })
    currency: string;

    @Prop({ default: 'pieces' })
    unit: string;

    @Prop({ default: false })
    isLowStock: boolean;

    @Prop({ default: false })
    isOutOfStock: boolean;

    @Prop()
    lastRestockedAt: Date;

    @Prop()
    lastStockCheckAt: Date;

    @Prop({ type: Types.ObjectId, ref: 'Branch' })
    branchId: Types.ObjectId;
}

export const InventoryItemSchema = SchemaFactory.createForClass(InventoryItem);

// Inventory Transaction Schema
@Schema({ timestamps: true })
export class InventoryTransaction {
    @Prop({ required: true, unique: true })
    transactionNumber: string;

    @Prop({ type: String, enum: InventoryTransactionType, required: true })
    type: InventoryTransactionType;

    @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
    productId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Branch' })
    fromBranchId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Branch' })
    toBranchId: Types.ObjectId;

    @Prop({ required: true, min: 0 })
    quantity: number;

    @Prop({ required: true, min: 0 })
    unitCost: number;

    @Prop({ required: true, min: 0 })
    totalCost: number;

    @Prop({ default: 'SYP' })
    currency: string;

    @Prop({ trim: true })
    reference: string; // Order number, PO number, etc.

    @Prop({ type: Types.ObjectId, ref: 'Order' })
    orderId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    supplierId: Types.ObjectId;

    @Prop({ trim: true })
    notes: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    createdBy: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    updatedBy: Types.ObjectId;

    @Prop({ default: false })
    isDeleted: boolean;
}

export const InventoryTransactionSchema = SchemaFactory.createForClass(InventoryTransaction);

// Main Inventory Schema
@Schema({ timestamps: true })
export class Inventory {
    @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
    productId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Branch', required: true })
    branchId: Types.ObjectId;

    @Prop({ required: true, min: 0 })
    currentStock: number;

    @Prop({ required: true, min: 0, default: 0 })
    reservedStock: number;

    @Prop({ required: true, min: 0 })
    availableStock: number;

    @Prop({ required: true, min: 0 })
    minStockLevel: number;

    @Prop({ required: true, min: 0 })
    maxStockLevel: number;

    @Prop({ default: 0 })
    reorderPoint: number;

    @Prop({ default: 0 })
    reorderQuantity: number;

    @Prop({ required: true, min: 0 })
    unitCost: number;

    @Prop({ default: 'SYP' })
    currency: string;

    @Prop({ default: 'pieces' })
    unit: string;

    @Prop({ default: false })
    isLowStock: boolean;

    @Prop({ default: false })
    isOutOfStock: boolean;

    @Prop()
    lastRestockedAt: Date;

    @Prop()
    lastStockCheckAt: Date;

    @Prop({ default: false })
    isDeleted: boolean;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    createdBy: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    updatedBy: Types.ObjectId;
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);

// Indexes for Inventory
InventorySchema.index({ productId: 1, branchId: 1 }, { unique: true });
InventorySchema.index({ branchId: 1 });
InventorySchema.index({ isLowStock: 1 });
InventorySchema.index({ isOutOfStock: 1 });
InventorySchema.index({ currentStock: 1 });
InventorySchema.index({ lastRestockedAt: -1 });

// Indexes for InventoryTransaction
// transactionNumber index is already created by @Prop({ unique: true })
InventoryTransactionSchema.index({ productId: 1 });
InventoryTransactionSchema.index({ type: 1 });
InventoryTransactionSchema.index({ branchId: 1 });
InventoryTransactionSchema.index({ createdAt: -1 });
InventoryTransactionSchema.index({ reference: 1 });

// Virtual for stock status
InventorySchema.virtual('stockStatus').get(function () {
    if (this.currentStock <= 0) return 'out_of_stock';
    if (this.currentStock <= this.minStockLevel) return 'low_stock';
    if (this.currentStock >= this.maxStockLevel) return 'overstocked';
    return 'normal';
});

// Virtual for stock value
InventorySchema.virtual('stockValue').get(function () {
    return this.currentStock * this.unitCost;
});

// Pre-save middleware for Inventory
InventorySchema.pre('save', function (next) {
    // Calculate available stock
    this.availableStock = this.currentStock - this.reservedStock;

    // Check stock status
    this.isLowStock = this.currentStock <= this.minStockLevel;
    this.isOutOfStock = this.currentStock <= 0;

    // Set last stock check
    this.lastStockCheckAt = new Date();

    next();
});

// Pre-save middleware for InventoryTransaction
InventoryTransactionSchema.pre('save', function (next) {
    // Generate transaction number if not provided
    if (!this.transactionNumber) {
        const timestamp = Date.now().toString().slice(-8);
        this.transactionNumber = `INV${timestamp}`;
    }

    // Calculate total cost
    this.totalCost = this.quantity * this.unitCost;

    next();
});

// Ensure virtual fields are serialised
InventorySchema.set('toJSON', { virtuals: true });
InventoryTransactionSchema.set('toJSON', { virtuals: true });
