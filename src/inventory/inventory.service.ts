import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as XLSX from 'xlsx';
import { Inventory, InventoryDocument, InventoryTransaction, InventoryTransactionDocument } from './scheme/inventory.scheme';
import { CreateInventoryDto, UpdateInventoryDto, InventoryQueryDto, StockAdjustmentDto, StockTransferDto, InventoryTransactionQueryDto, ImportInventoryDto, ImportResultDto, ImportErrorDto, ImportSummaryDto, ExcelRowDataDto } from './dto';
import { InventoryTransactionType } from 'src/common/enums';
import { Product, ProductDocument } from 'src/products/scheme/product.schem';

@Injectable()
export class InventoryService {
    constructor(
        @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
        @InjectModel(InventoryTransaction.name) private transactionModel: Model<InventoryTransactionDocument>,
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
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

        // Update product's branch pricing with new quantity and cost
        await this.updateProductBranchPricing(productId, branchId, inventory.currentStock, unitCost);

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

        // Update product's branch pricing for both branches
        await this.updateProductBranchPricing(productId, fromBranchId, fromInventory.currentStock, fromInventory.unitCost);
        await this.updateProductBranchPricing(productId, toBranchId, toInventory.currentStock, unitCost);

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
        const updatedInventory = await inventory.save();

        // Update product's branch pricing with new available stock
        await this.updateProductBranchPricing(productId, branchId, inventory.currentStock, inventory.unitCost);

        return updatedInventory;
    }

    async releaseReservedStock(productId: string, branchId: string, quantity: number, userId: string): Promise<Inventory> {
        const inventory = await this.findByProductAndBranch(productId, branchId);

        if (inventory.reservedStock < quantity) {
            throw new BadRequestException('الكمية المحجوزة أقل من المطلوب');
        }

        inventory.reservedStock -= quantity;
        inventory.updatedBy = new Types.ObjectId(userId);
        const updatedInventory = await inventory.save();

        // Update product's branch pricing with new available stock
        await this.updateProductBranchPricing(productId, branchId, inventory.currentStock, inventory.unitCost);

        return updatedInventory;
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

    // Excel Import Methods
    async importInventoryFromExcel(
        file: Express.Multer.File,
        importInventoryDto: ImportInventoryDto,
        userId: string
    ): Promise<ImportResultDto> {
        try {
            // Read Excel file
            const workbook = XLSX.read(file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            // Skip header row and process data
            const dataRows = jsonData.slice(1);

            const result: ImportResultDto = {
                success: true,
                message: 'تم استيراد المخزون بنجاح',
                totalRows: dataRows.length,
                processedRows: 0,
                skippedRows: 0,
                errors: [],
                summary: {
                    productsUpdated: 0,
                    productsCreated: 0,
                    productsNotFound: 0,
                    totalQuantityUpdated: 0,
                    totalValueUpdated: 0,
                }
            };

            // Process each row
            for (let i = 0; i < dataRows.length; i++) {
                const row = dataRows[i] as any[];
                const rowNumber = i + 2; // +2 because we skipped header and arrays are 0-indexed

                try {
                    // Validate row data
                    if (!row || row.length < 2) {
                        result.errors.push({
                            row: rowNumber,
                            productCode: '',
                            error: 'صف فارغ أو غير مكتمل',
                            data: row
                        });
                        result.skippedRows++;
                        continue;
                    }

                    const productCode = String(row[0] || '').trim();
                    const quantity = Number(row[1]) || 0;
                    const unitCost = Number(row[2]) || 0;

                    if (!productCode) {
                        result.errors.push({
                            row: rowNumber,
                            productCode: '',
                            error: 'رمز المنتج مطلوب',
                            data: row
                        });
                        result.skippedRows++;
                        continue;
                    }

                    if (quantity < 0) {
                        result.errors.push({
                            row: rowNumber,
                            productCode,
                            error: 'الكمية يجب أن تكون أكبر من أو تساوي صفر',
                            data: row
                        });
                        result.skippedRows++;
                        continue;
                    }

                    // Find product by SKU or barcode
                    const product = await this.findProductByCode(productCode);

                    if (!product) {
                        result.errors.push({
                            row: rowNumber,
                            productCode,
                            error: 'المنتج غير موجود',
                            data: row
                        });
                        result.summary.productsNotFound++;
                        result.skippedRows++;
                        continue;
                    }

                    // Process inventory update
                    await this.processInventoryImport(
                        (product as any)._id.toString(),
                        importInventoryDto.branchId,
                        quantity,
                        unitCost,
                        importInventoryDto.importMode,
                        userId,
                        importInventoryDto.notes
                    );

                    result.processedRows++;
                    result.summary.productsUpdated++;
                    result.summary.totalQuantityUpdated += quantity;
                    result.summary.totalValueUpdated += (quantity * unitCost);

                } catch (error) {
                    result.errors.push({
                        row: rowNumber,
                        productCode: String(row[0] || ''),
                        error: error.message || 'خطأ غير معروف',
                        data: row
                    });
                    result.skippedRows++;
                }
            }

            // Update result message based on errors
            if (result.errors.length > 0) {
                result.message = `تم استيراد ${result.processedRows} منتج بنجاح، مع ${result.errors.length} أخطاء`;
            }

            return result;

        } catch (error) {
            throw new BadRequestException(`خطأ في معالجة الملف: ${error.message}`);
        }
    }

    private async findProductByCode(code: string): Promise<Product | null> {
        // Search by SKU in branch pricing
        const productBySku = await this.productModel.findOne({
            'branchPricing.sku': code,
            isDeleted: false
        }).exec();

        if (productBySku) {
            return productBySku;
        }

        // Search by barcode
        const productByBarcode = await this.productModel.findOne({
            barcode: code,
            isDeleted: false
        }).exec();

        return productByBarcode;
    }

    private async processInventoryImport(
        productId: string,
        branchId: string,
        quantity: number,
        unitCost: number,
        importMode: 'replace' | 'add' | 'subtract',
        userId: string,
        notes?: string
    ): Promise<void> {
        // Find existing inventory
        let inventory = await this.inventoryModel.findOne({
            productId: new Types.ObjectId(productId),
            branchId: new Types.ObjectId(branchId),
            isDeleted: false
        }).exec();

        let newQuantity = quantity;
        let transactionType = InventoryTransactionType.ADJUSTMENT;

        if (inventory) {
            // Update existing inventory
            switch (importMode) {
                case 'replace':
                    newQuantity = quantity;
                    transactionType = InventoryTransactionType.ADJUSTMENT;
                    break;
                case 'add':
                    newQuantity = inventory.currentStock + quantity;
                    transactionType = InventoryTransactionType.PURCHASE;
                    break;
                case 'subtract':
                    newQuantity = Math.max(0, inventory.currentStock - quantity);
                    transactionType = InventoryTransactionType.ADJUSTMENT;
                    break;
            }

            inventory.currentStock = newQuantity;
            inventory.availableStock = newQuantity - inventory.reservedStock;
            inventory.unitCost = unitCost || inventory.unitCost;
            inventory.updatedBy = new Types.ObjectId(userId);
            inventory.lastStockCheckAt = new Date();

            await inventory.save();
        } else {
            // Create new inventory record
            inventory = new this.inventoryModel({
                productId: new Types.ObjectId(productId),
                branchId: new Types.ObjectId(branchId),
                currentStock: quantity,
                reservedStock: 0,
                availableStock: quantity,
                minStockLevel: 0,
                maxStockLevel: quantity * 2, // Set max to double the imported quantity
                unitCost: unitCost,
                currency: 'SYP',
                unit: 'pieces',
                isLowStock: false,
                isOutOfStock: quantity === 0,
                lastStockCheckAt: new Date(),
                createdBy: new Types.ObjectId(userId),
                updatedBy: new Types.ObjectId(userId),
            });

            await inventory.save();
            transactionType = InventoryTransactionType.PURCHASE;
        }

        // Update product's branch pricing with new quantity and cost
        await this.updateProductBranchPricing(productId, branchId, newQuantity, unitCost);

        // Create transaction record
        await this.createTransaction({
            type: transactionType,
            productId: new Types.ObjectId(productId),
            toBranchId: new Types.ObjectId(branchId),
            quantity: importMode === 'subtract' ? -quantity : quantity,
            unitCost: unitCost,
            reference: 'Excel Import',
            notes: notes || `استيراد من ملف Excel - وضع: ${importMode}`,
            createdBy: new Types.ObjectId(userId),
        });
    }

    private async updateProductBranchPricing(
        productId: string,
        branchId: string,
        quantity: number,
        unitCost: number
    ): Promise<void> {
        try {
            const product = await this.productModel.findById(productId).exec();

            if (!product) {
                return; // Product not found, skip update
            }

            // Find existing branch pricing
            const existingBranchPricingIndex = product.branchPricing.findIndex(
                (bp: any) => bp.branchId.toString() === branchId
            );

            if (existingBranchPricingIndex >= 0) {
                // Update existing branch pricing
                product.branchPricing[existingBranchPricingIndex].stockQuantity = quantity;
                if (unitCost > 0) {
                    product.branchPricing[existingBranchPricingIndex].costPrice = unitCost;
                }
            } else {
                // Create new branch pricing entry
                const newBranchPricing = {
                    branchId: new Types.ObjectId(branchId),
                    price: product.branchPricing[0]?.price || 0, // Use first branch price as default
                    costPrice: unitCost || 0,
                    wholeSalePrice: product.branchPricing[0]?.wholeSalePrice || 0,
                    salePrice: product.branchPricing[0]?.salePrice || 0,
                    currency: 'SYP',
                    stockQuantity: quantity,
                    sku: `${product.name.substring(0, 3).toUpperCase()}${Date.now()}`, // Generate SKU
                    isOnSale: false,
                    isActive: true,
                };

                product.branchPricing.push(newBranchPricing);
            }

            // Add branch to product's branches array if not already present
            const branchObjectId = new Types.ObjectId(branchId);
            if (!product.branches.some(branch => branch.toString() === branchId)) {
                product.branches.push(branchObjectId);
            }

            await product.save();
        } catch (error) {
            // Log error but don't fail the import process
            console.error('Error updating product branch pricing:', error);
        }
    }

    // Get import template
    async getImportTemplate(): Promise<Buffer> {
        const templateData = [
            ['رمز المنتج', 'الكمية', 'سعر التكلفة'],
            ['PROD001', 100, 50],
            ['PROD002', 200, 75],
            ['PROD003', 150, 60]
        ];

        const worksheet = XLSX.utils.aoa_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'المخزون');

        return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    }
}
