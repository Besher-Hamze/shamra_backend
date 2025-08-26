import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Inventory, InventoryDocument, InventoryTransaction, InventoryTransactionDocument } from './scheme/inventory.scheme';
import { CreateInventoryDto, UpdateInventoryDto, InventoryQueryDto, StockAdjustmentDto, StockTransferDto, InventoryTransactionQueryDto } from './dto';
import { InventoryTransactionType } from 'src/common/enums';

@Injectable()
export class InventoryService {
    constructor(
        @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
        @InjectModel(InventoryTransaction.name) private transactionModel: Model<InventoryTransactionDocument>,
    ) { }

    async create(createInventoryDto: CreateInventoryDto, userId: string): Promise<Inventory> {
        // Check if inventory already exists for this product and branch
        const existingInventory = await this.inventoryModel.findOne({
            productId: createInventoryDto.productId,
            branchId: createInventoryDto.branchId,
            isDeleted: false,
        });

        if (existingInventory) {
            throw new ConflictException('المخزون موجود بالفعل لهذا المنتج في هذا الفرع');
        }

        const inventory = new this.inventoryModel({
            ...createInventoryDto,
            createdBy: userId,
            updatedBy: userId,
        });

        return await inventory.save();
    }

    async findAll(query: InventoryQueryDto) {
        const { page = 1, limit = 20, productId, branchId, isLowStock, isOutOfStock, search } = query;
        const skip = (page - 1) * limit;

        const filter: any = { isDeleted: false };

        if (productId) filter.productId = new Types.ObjectId(productId);
        if (branchId) filter.branchId = new Types.ObjectId(branchId);
        if (isLowStock !== undefined) filter.isLowStock = isLowStock;
        if (isOutOfStock !== undefined) filter.isOutOfStock = isOutOfStock;

        // Text search
        if (search) {
            filter.$text = { $search: search };
        }

        const [inventories, total] = await Promise.all([
            this.inventoryModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('productId', 'name nameAr sku barcode')
                .populate('branchId', 'name nameAr')
                .exec(),
            this.inventoryModel.countDocuments(filter),
        ]);

        return {
            data: inventories,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string): Promise<Inventory> {
        const inventory = await this.inventoryModel
            .findById(id)
            .populate('productId', 'name nameAr sku barcode')
            .populate('branchId', 'name nameAr')
            .exec();

        if (!inventory || inventory.isDeleted) {
            throw new NotFoundException('المخزون غير موجود');
        }

        return inventory;
    }

    async findByProductAndBranch(productId: string, branchId: string): Promise<InventoryDocument> {
        const inventory = await this.inventoryModel
            .findOne({
                productId: new Types.ObjectId(productId),
                branchId: new Types.ObjectId(branchId),
                isDeleted: false,
            })
            .populate('productId', 'name nameAr sku barcode')
            .populate('branchId', 'name nameAr')
            .exec();

        if (!inventory) {
            throw new NotFoundException('المخزون غير موجود');
        }

        return inventory;
    }

    async update(id: string, updateInventoryDto: UpdateInventoryDto, userId: string): Promise<Inventory> {
        const inventory = await this.inventoryModel.findByIdAndUpdate(
            id,
            {
                ...updateInventoryDto,
                updatedBy: userId,
            },
            { new: true }
        );

        if (!inventory || inventory.isDeleted) {
            throw new NotFoundException('المخزون غير موجود');
        }

        return inventory;
    }

    async remove(id: string, userId: string): Promise<void> {
        const inventory = await this.inventoryModel.findByIdAndUpdate(
            id,
            {
                isDeleted: true,
                updatedBy: userId,
            }
        );

        if (!inventory) {
            throw new NotFoundException('المخزون غير موجود');
        }
    }

    // Stock Management Methods
    async adjustStock(stockAdjustmentDto: StockAdjustmentDto, userId: string): Promise<Inventory> {
        const { productId, branchId, type, quantity, unitCost, reference, notes, orderId } = stockAdjustmentDto;

        // Find inventory
        const inventory = await this.findByProductAndBranch(productId, branchId);

        // Calculate new stock based on transaction type
        let newStock = inventory.currentStock;
        switch (type) {
            case InventoryTransactionType.PURCHASE:
            case InventoryTransactionType.RETURN:
                newStock += quantity;
                break;
            case InventoryTransactionType.SALE:
                if (quantity > inventory.availableStock) {
                    throw new BadRequestException('الكمية المطلوبة غير متوفرة في المخزون');
                }
                newStock -= quantity;
                break;
            case InventoryTransactionType.ADJUSTMENT:
                newStock = quantity; // Direct adjustment
                break;
            default:
                throw new BadRequestException('نوع المعاملة غير صحيح');
        }

        // Update inventory
        inventory.currentStock = Math.max(0, newStock);
        inventory.unitCost = unitCost;
        inventory.updatedBy = new Types.ObjectId(userId);
        await inventory.save();

        // Create transaction record
        await this.createTransaction({
            type,
            productId: new Types.ObjectId(productId),
            toBranchId: new Types.ObjectId(branchId),
            quantity,
            unitCost,
            reference,
            notes,
            orderId: orderId ? new Types.ObjectId(orderId) : undefined,
            createdBy: new Types.ObjectId(userId),
        });

        return inventory;
    }

    async transferStock(stockTransferDto: StockTransferDto, userId: string): Promise<{ fromInventory: Inventory; toInventory: Inventory }> {
        const { productId, fromBranchId, toBranchId, quantity, unitCost, reference, notes } = stockTransferDto;

        if (fromBranchId === toBranchId) {
            throw new BadRequestException('لا يمكن نقل المخزون لنفس الفرع');
        }

        // Find source inventory
        const fromInventory = await this.findByProductAndBranch(productId, fromBranchId);
        if (fromInventory.availableStock < quantity) {
            throw new BadRequestException('الكمية المطلوبة غير متوفرة في المخزون المصدر');
        }

        // Find or create destination inventory
        let toInventory: InventoryDocument;
        try {
            toInventory = await this.findByProductAndBranch(productId, toBranchId);
        } catch {
            // Create new inventory record for destination branch
            toInventory = await this.create({
                productId,
                branchId: toBranchId,
                currentStock: 0,
                minStockLevel: fromInventory.minStockLevel,
                maxStockLevel: fromInventory.maxStockLevel,
                reorderPoint: fromInventory.reorderPoint,
                reorderQuantity: fromInventory.reorderQuantity,
                unitCost,
                currency: fromInventory.currency,
                unit: fromInventory.unit,
            }, userId) as InventoryDocument;
        }

        // Update stock levels
        fromInventory.currentStock -= quantity;
        fromInventory.updatedBy = new Types.ObjectId(userId);
        await fromInventory.save();

        toInventory.currentStock += quantity;
        toInventory.unitCost = unitCost;
        toInventory.updatedBy = new Types.ObjectId(userId);
        await toInventory.save();

        // Create transfer transaction
        await this.createTransaction({
            type: InventoryTransactionType.TRANSFER,
            productId: new Types.ObjectId(productId),
            fromBranchId: new Types.ObjectId(fromBranchId),
            toBranchId: new Types.ObjectId(toBranchId),
            quantity,
            unitCost,
            reference,
            notes,
            createdBy: new Types.ObjectId(userId),
        });

        return { fromInventory, toInventory };
    }

    async reserveStock(productId: string, branchId: string, quantity: number, userId: string): Promise<Inventory> {
        const inventory = await this.findByProductAndBranch(productId, branchId);

        if (inventory.availableStock < quantity) {
            throw new BadRequestException('الكمية المطلوبة غير متوفرة في المخزون');
        }

        inventory.reservedStock += quantity;
        inventory.updatedBy = new Types.ObjectId(userId);
        return await inventory.save();
    }

    async releaseReservedStock(productId: string, branchId: string, quantity: number, userId: string): Promise<Inventory> {
        const inventory = await this.findByProductAndBranch(productId, branchId);

        if (inventory.reservedStock < quantity) {
            throw new BadRequestException('الكمية المحجوزة أقل من المطلوب');
        }

        inventory.reservedStock -= quantity;
        inventory.updatedBy = new Types.ObjectId(userId);
        return await inventory.save();
    }

    // Transaction Management
    async createTransaction(transactionData: Partial<InventoryTransaction>): Promise<InventoryTransaction> {
        const transaction = new this.transactionModel(transactionData);
        return await transaction.save();
    }

    async findTransactions(query: InventoryTransactionQueryDto) {
        const { page = 1, limit = 20, productId, branchId, type, reference } = query;
        const skip = (page - 1) * limit;

        const filter: any = { isDeleted: false };

        if (productId) filter.productId = new Types.ObjectId(productId);
        if (branchId) filter.$or = [
            { fromBranchId: new Types.ObjectId(branchId) },
            { toBranchId: new Types.ObjectId(branchId) }
        ];
        if (type) filter.type = type;
        if (reference) filter.reference = { $regex: reference, $options: 'i' };

        const [transactions, total] = await Promise.all([
            this.transactionModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('productId', 'name nameAr sku')
                .populate('fromBranchId', 'name nameAr')
                .populate('toBranchId', 'name nameAr')
                .populate('orderId', 'orderNumber')
                .populate('createdBy', 'firstName lastName')
                .exec(),
            this.transactionModel.countDocuments(filter),
        ]);

        return {
            data: transactions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }

    // Analytics and Reports
    async getInventoryStats(branchId?: string) {
        const filter: any = { isDeleted: false };
        if (branchId) {
            filter.branchId = new Types.ObjectId(branchId);
        }

        const [totalProducts, lowStockCount, outOfStockCount, totalValue] = await Promise.all([
            this.inventoryModel.countDocuments(filter),
            this.inventoryModel.countDocuments({ ...filter, isLowStock: true }),
            this.inventoryModel.countDocuments({ ...filter, isOutOfStock: true }),
            this.inventoryModel.aggregate([
                { $match: filter },
                { $group: { _id: null, totalValue: { $sum: { $multiply: ['$currentStock', '$unitCost'] } } } }
            ]),
        ]);

        return {
            totalProducts,
            lowStockCount,
            outOfStockCount,
            totalValue: totalValue[0]?.totalValue || 0,
        };
    }

    async getLowStockItems(branchId?: string, limit: number = 50): Promise<Inventory[]> {
        const filter: any = { isDeleted: false, isLowStock: true };
        if (branchId) {
            filter.branchId = new Types.ObjectId(branchId);
        }

        return await this.inventoryModel
            .find(filter)
            .sort({ currentStock: 1 })
            .limit(limit)
            .populate('productId', 'name nameAr sku')
            .populate('branchId', 'name nameAr')
            .exec();
    }

    async getStockMovement(productId: string, branchId: string, days: number = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const filter: any = {
            productId: new Types.ObjectId(productId),
            isDeleted: false,
            createdAt: { $gte: startDate },
        };

        if (branchId) {
            filter.$or = [
                { fromBranchId: new Types.ObjectId(branchId) },
                { toBranchId: new Types.ObjectId(branchId) }
            ];
        }

        return await this.transactionModel
            .find(filter)
            .sort({ createdAt: -1 })
            .populate('fromBranchId', 'name nameAr')
            .populate('toBranchId', 'name nameAr')
            .populate('createdBy', 'firstName lastName')
            .exec();
    }
}
