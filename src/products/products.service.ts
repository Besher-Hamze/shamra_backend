import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
    CreateProductDto,
    UpdateProductDto,
    ProductQueryDto,
    UpdateStockDto,
    UpdatePriceDto,
} from './dto';
import { Product, ProductDocument } from './scheme/product.schem';
import { Category, CategoryDocument } from 'src/categories/scheme/category.scheme';
import { SubCategory, SubCategoryDocument } from 'src/sub-categories/scheme/sub-category.scheme';
import { Branch, BranchDocument } from 'src/branches/scheme/branche.scheme';
import { SubCategoryType, UserRole } from 'src/common/enums';

@Injectable()
export class ProductsService {
    private readonly logger = new Logger(ProductsService.name);

    constructor(
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
        @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
        @InjectModel(SubCategory.name) private subCategoryModel: Model<SubCategoryDocument>,
        @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
    ) { }

    // Create new product
    async create(createProductDto: CreateProductDto, userId: string): Promise<Product> {
        try {
            this.logger.log(`Creating product: ${createProductDto.name}`);
            const { categoryId, subCategoryId, branches } = createProductDto;

            // Validate category
            const category = await this.categoryModel.findById(categoryId).exec();
            if (!category || category.isDeleted || !category.isActive) {
                throw new NotFoundException('Category not found or inactive');
            }

            // Validate subcategory if provided
            let subCategory;
            if (subCategoryId) {
                subCategory = await this.subCategoryModel.findById(subCategoryId).exec();
                if (!subCategory || subCategory.isDeleted || !subCategory.isActive) {
                    throw new NotFoundException('SubCategory not found or inactive');
                }
                // Ensure subcategory belongs to the specified category
                if (subCategory.categoryId.toString() !== categoryId) {
                    throw new BadRequestException('SubCategory does not belong to the specified category');
                }

                // Validate specifications based on subcategory type
                if (subCategory.type === SubCategoryType.CUSTOM_ATTR) {
                    // If subcategory has custom attributes, validate specifications
                    if (createProductDto.specifications && subCategory.customFields.length > 0) {
                        const specKeys = Object.keys(createProductDto.specifications);
                        const invalidKeys = specKeys.filter(key => !subCategory.customFields.includes(key));
                        if (invalidKeys.length > 0) {
                            throw new BadRequestException(`Invalid specification fields: ${invalidKeys.join(', ')}. Allowed fields: ${subCategory.customFields.join(', ')}`);
                        }
                    }
                } else if (subCategory.type === SubCategoryType.FREE_ATTR) {
                    // For free attributes, set specifications to empty object
                    createProductDto.specifications = {};
                }
            }

            // Validate branches
            if (branches && branches.length > 0) {
                const branch = await this.branchModel.find({ _id: { $in: branches } }).exec();
                if (!branch || branch.length === 0 || branch.some(b => b.isDeleted || !b.isActive)) {
                    throw new NotFoundException('One or more branches not found or inactive');
                }
            }

            const product = new this.productModel({
                ...createProductDto,
                createdBy: userId,
                updatedBy: userId,
            });

            const savedProduct = await product.save();

            // Update category product count
            await this.categoryModel
                .findByIdAndUpdate(categoryId, { $inc: { productCount: 1 } })
                .exec();

            this.logger.log(`Product created successfully: ${savedProduct._id}`);
            return savedProduct;
        } catch (error) {
            this.logger.error(`Error creating product: ${error.message}`, error.stack);

            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            // if error dublicated 
            if (error.code === 11000) {
                throw new ConflictException('رقم المنتج موجود من قبل');
            }
            throw new InternalServerErrorException('حدث خطأ ما');
        }
    }

    // Find all products with pagination and filtering
    async findAll(query: ProductQueryDto, userRole?: UserRole) {
        try {
            const {
                page = 1,
                limit = 20,
                sort = '-createdAt',
                categoryId,
                subCategoryId,
                brand,
                status,
                isActive,
                isFeatured,
                isOnSale,
                minPrice,
                maxPrice,
                search,
                tags,
                branchId,
                selectedBranchId,
            } = query;

            // Build filter
            const filter: any = { isDeleted: { $ne: true } };

            if (categoryId) filter.categoryId = categoryId;
            if (subCategoryId) filter.subCategoryId = subCategoryId;
            if (brand) filter.brand = { $regex: brand, $options: 'i' };
            if (status) filter.status = status;
            if (isActive !== undefined) filter.isActive = isActive;
            if (isFeatured !== undefined) filter.isFeatured = isFeatured;

            // Price range filter
            if (minPrice !== undefined || maxPrice !== undefined) {
                if (selectedBranchId) {
                    filter['branchPricing'] = {
                        $elemMatch: {
                            branchId: selectedBranchId,
                            price: { $gte: minPrice, $lte: maxPrice }
                        }
                    };
                } else {
                    filter.price = {};
                    // Fix: search min/max price in any branchPricing.price if no selectedBranchId
                    if (minPrice !== undefined || maxPrice !== undefined) {
                        filter['branchPricing'] = filter['branchPricing'] || { $elemMatch: {} };
                        if (!filter['branchPricing'].$elemMatch) filter['branchPricing'] = { $elemMatch: {} };
                        if (minPrice !== undefined && maxPrice !== undefined) {
                            filter['branchPricing'].$elemMatch.price = { $gte: minPrice, $lte: maxPrice };
                        } else if (minPrice !== undefined) {
                            filter['branchPricing'].$elemMatch.price = { $gte: minPrice };
                        } else if (maxPrice !== undefined) {
                            filter['branchPricing'].$elemMatch.price = { $lte: maxPrice };
                        }
                    }
                }
            }

            // Tags filter
            if (tags && tags.length > 0) {
                filter.tags = { $in: tags };
            }

            // Branch filter
            if (branchId) {
                filter.branches = { $in: [branchId] };
            }
            if (selectedBranchId && userRole != UserRole.ADMIN) {
                filter.branches = { $in: [selectedBranchId] };
            }
            if (isOnSale !== undefined) {
                if (selectedBranchId) {
                    filter['branchPricing'] = {
                        $elemMatch: {
                            branchId: selectedBranchId,
                            isOnSale: isOnSale
                        }
                    };
                } else {
                    filter['branchPricing.isOnSale'] = isOnSale;
                }
            }

            // Search filter
            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { brand: { $regex: search, $options: 'i' } },
                    { tags: { $in: [new RegExp(search, 'i')] } },
                ];
            }

            // Calculate pagination
            const skip = (page - 1) * limit;
            const total = await this.productModel.countDocuments(filter).exec();
            const pages = Math.ceil(total / limit);

            // Get products
            const products = await this.productModel
                .find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('category', 'name  image isActive')
                .populate('subCategory', 'name categoryId type customFields isActive')
                .exec();

            this.logger.log(`Found ${products.length} products out of ${total} total`);
            return {
                data: products,
                pagination: {
                    page,
                    limit,
                    total,
                    pages,
                    hasNext: page < pages,
                    hasPrev: page > 1,
                },
            };
        } catch (error) {
            this.logger.error(`Error finding products: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Failed to retrieve products');
        }
    }

    // Find product by ID
    async findById(id: string): Promise<Product> {
        try {
            this.logger.log(`Finding product by ID: ${id}`);

            const product = await this.productModel
                .findById(id)
                .populate('category', 'name  description  image isActive isFeatured')
                .populate('subCategory', 'name categoryId type customFields isActive')
                .populate('branchDetails')
                .exec();

            if (!product || product.isDeleted) {
                throw new NotFoundException('Product not found');
            }

            // Increment view count
            await this.productModel
                .findByIdAndUpdate(id, { $inc: { viewCount: 1 } })
                .exec();

            this.logger.log(`Product found successfully: ${product.name}`);
            return product;
        } catch (error) {
            this.logger.error(`Error finding product by ID ${id}: ${error.message}`, error.stack);

            if (error instanceof NotFoundException) {
                throw error;
            }

            throw new InternalServerErrorException('Failed to retrieve product');
        }
    }

    // Update product
    async update(id: string, updateProductDto: UpdateProductDto, userId: string): Promise<Product> {
        try {
            this.logger.log(`Updating product: ${id}`);
            const { categoryId } = updateProductDto;

            // Validate category if being changed
            if (categoryId) {
                const category = await this.categoryModel.findById(categoryId).exec();
                if (!category || category.isDeleted || !category.isActive) {
                    throw new NotFoundException('Category not found or inactive');
                }

                // Update old and new category product counts
                const currentProduct = await this.productModel.findById(id).exec();
                if (currentProduct && String(currentProduct.categoryId) !== categoryId) {
                    // Decrease old category count
                    await this.categoryModel
                        .findByIdAndUpdate(currentProduct.categoryId, { $inc: { productCount: -1 } })
                        .exec();

                    // Increase new category count
                    await this.categoryModel
                        .findByIdAndUpdate(categoryId, { $inc: { productCount: 1 } })
                        .exec();
                }
            }

            const product = await this.productModel
                .findByIdAndUpdate(
                    id,
                    { ...updateProductDto, updatedBy: userId },
                    { new: true }
                )
                .exec();

            if (!product || product.isDeleted) {
                throw new NotFoundException('Product not found');
            }

            this.logger.log(`Product updated successfully: ${product.name}`);
            return product;
        } catch (error) {
            this.logger.error(`Error updating product ${id}: ${error.message}`, error.stack);

            if (error instanceof NotFoundException) {
                throw error;
            }

            throw new InternalServerErrorException('Failed to update product');
        }
    }

    // Update stock quantity
    async updateStock(id: string, updateStockDto: UpdateStockDto, userId: string): Promise<Product> {
        try {
            this.logger.log(`Updating stock for product: ${id}`);

            const product = await this.productModel
                .findByIdAndUpdate(
                    id,
                    {
                        stockQuantity: updateStockDto.stockQuantity,
                        updatedBy: userId
                    },
                    { new: true }
                )
                .exec();

            if (!product || product.isDeleted) {
                throw new NotFoundException('Product not found');
            }

            this.logger.log(`Stock updated successfully for product: ${product.name}`);
            return product;
        } catch (error) {
            this.logger.error(`Error updating stock for product ${id}: ${error.message}`, error.stack);

            if (error instanceof NotFoundException) {
                throw error;
            }

            throw new InternalServerErrorException('Failed to update product stock');
        }
    }

    // Update product prices
    async updatePrice(id: string, updatePriceDto: UpdatePriceDto, userId: string): Promise<Product> {
        try {
            this.logger.log(`Updating price for product: ${id}`);

            const product = await this.productModel
                .findByIdAndUpdate(
                    id,
                    { ...updatePriceDto, updatedBy: userId },
                    { new: true }
                )
                .exec();

            if (!product || product.isDeleted) {
                throw new NotFoundException('Product not found');
            }

            this.logger.log(`Price updated successfully for product: ${product.name}`);
            return product;
        } catch (error) {
            this.logger.error(`Error updating price for product ${id}: ${error.message}`, error.stack);

            if (error instanceof NotFoundException) {
                throw error;
            }

            throw new InternalServerErrorException('Failed to update product price');
        }
    }

    // Toggle active status
    async toggleActive(id: string, userId: string): Promise<Product> {
        try {
            this.logger.log(`Toggling active status for product: ${id}`);

            const product = await this.productModel.findById(id).exec();
            if (!product || product.isDeleted) {
                throw new NotFoundException('Product not found');
            }

            product.isActive = !product.isActive;
            product.updatedBy = userId as any;
            const savedProduct = await product.save();

            this.logger.log(`Active status toggled successfully for product: ${savedProduct.name}`);
            return savedProduct;
        } catch (error) {
            this.logger.error(`Error toggling active status for product ${id}: ${error.message}`, error.stack);

            if (error instanceof NotFoundException) {
                throw error;
            }

            throw new InternalServerErrorException('Failed to toggle product active status');
        }
    }

    // Toggle featured status
    async toggleFeatured(id: string, userId: string): Promise<Product> {
        try {
            this.logger.log(`Toggling featured status for product: ${id}`);

            const product = await this.productModel.findById(id).exec();
            if (!product || product.isDeleted) {
                throw new NotFoundException('Product not found');
            }

            product.isFeatured = !product.isFeatured;
            product.updatedBy = userId as any;
            const savedProduct = await product.save();

            this.logger.log(`Featured status toggled successfully for product: ${savedProduct.name}`);
            return savedProduct;
        } catch (error) {
            this.logger.error(`Error toggling featured status for product ${id}: ${error.message}`, error.stack);

            if (error instanceof NotFoundException) {
                throw error;
            }

            throw new InternalServerErrorException('Failed to toggle product featured status');
        }
    }

    // Soft delete product
    async remove(id: string, userId: string): Promise<void> {
        try {
            this.logger.log(`Soft deleting product: ${id}`);

            const product = await this.productModel.findById(id).exec();
            if (!product || product.isDeleted) {
                throw new NotFoundException('Product not found');
            }

            // Update category product count
            await this.categoryModel
                .findByIdAndUpdate(product.categoryId, { $inc: { productCount: -1 } })
                .exec();

            await this.productModel
                .findByIdAndUpdate(id, {
                    isDeleted: true,
                    isActive: false,
                    updatedBy: userId,
                })
                .exec();

            this.logger.log(`Product soft deleted successfully: ${product.name}`);
        } catch (error) {
            this.logger.error(`Error soft deleting product ${id}: ${error.message}`, error.stack);

            if (error instanceof NotFoundException) {
                throw error;
            }

            throw new InternalServerErrorException('Failed to delete product');
        }
    }

    // Get featured products
    async getFeatured(limit: number = 10) {
        try {
            this.logger.log(`Getting featured products with limit: ${limit}`);

            const products = await this.productModel
                .find({
                    isFeatured: true,
                    isActive: true,
                    isDeleted: { $ne: true }
                })
                .limit(limit)
                .sort({ sortOrder: 1, createdAt: -1 })
                .populate('category', 'name  image isActive')
                .populate('subCategory', 'name type customFields isActive')
                .exec();

            this.logger.log(`Found ${products.length} featured products`);
            return products;
        } catch (error) {
            this.logger.error(`Error getting featured products: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Failed to retrieve featured products');
        }
    }

    // Get products on sale
    async getOnSale(limit: number = 20, branchId?: string) {
        try {
            this.logger.log(`Getting products on sale with limit: ${limit} and branchId: ${branchId}`);
            const filter: any = {
                isDeleted: { $ne: true },
                isActive: true
            };

            if (branchId) {
                filter.branches = { $in: [branchId] };
                filter['branchPricing'] = {
                    $elemMatch: {
                        branchId: branchId,
                        isOnSale: true
                    }
                };
            } else {
                filter['branchPricing.isOnSale'] = true;
            }

            const products = await this.productModel
                .find(filter)
                .limit(limit)
                .sort({ createdAt: -1 })
                .populate('category', 'name  image isActive')
                .populate('subCategory', 'name type customFields isActive')
                .exec();

            this.logger.log(`Found ${products.length} products on sale`);
            return products;
        } catch (error) {
            this.logger.error(`Error getting products on sale: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Failed to retrieve products on sale');
        }
    }

    // Get low stock products
    async getLowStock(limit: number = 50) {
        try {
            this.logger.log(`Getting low stock products with limit: ${limit}`);

            const products = await this.productModel
                .find({
                    $expr: { $lte: ['$stockQuantity', '$minStockLevel'] },
                    isActive: true,
                    isDeleted: { $ne: true }
                })
                .limit(limit)
                .sort({ stockQuantity: 1 })
                .populate('category', 'name image isActive')
                .populate('subCategory', 'name type customFields isActive')
                .exec();

            this.logger.log(`Found ${products.length} low stock products`);
            return products;
        } catch (error) {
            this.logger.error(`Error getting low stock products: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Failed to retrieve low stock products');
        }
    }

    // Get product statistics
    async getProductStats() {
        try {
            this.logger.log('Getting product statistics');

            const totalProducts = await this.productModel
                .countDocuments({ isDeleted: { $ne: true } })
                .exec();

            const activeProducts = await this.productModel
                .countDocuments({ isActive: true, isDeleted: { $ne: true } })
                .exec();

            const featuredProducts = await this.productModel
                .countDocuments({ isFeatured: true, isDeleted: { $ne: true } })
                .exec();

            const onSaleProducts = await this.productModel
                .countDocuments({
                    'branchPricing.isOnSale': true,
                    isDeleted: { $ne: true }
                })
                .exec();

            const outOfStockProducts = await this.productModel
                .countDocuments({ stockQuantity: 0, isDeleted: { $ne: true } })
                .exec();

            const lowStockProducts = await this.productModel
                .countDocuments({
                    $expr: { $lte: ['$stockQuantity', '$minStockLevel'] },
                    isDeleted: { $ne: true }
                })
                .exec();

            // Top selling products
            const topSelling = await this.productModel
                .find({ isDeleted: { $ne: true } })
                .sort({ totalSales: -1 })
                .limit(5)
                .select('name  totalSales')
                .exec();

            // Most viewed products
            const mostViewed = await this.productModel
                .find({ isDeleted: { $ne: true } })
                .sort({ viewCount: -1 })
                .limit(5)
                .select('name  viewCount')
                .exec();

            this.logger.log(`Product statistics retrieved successfully`);
            return {
                totalProducts,
                activeProducts,
                inactiveProducts: totalProducts - activeProducts,
                featuredProducts,
                onSaleProducts,
                outOfStockProducts,
                lowStockProducts,
                topSelling,
                mostViewed,
            };
        } catch (error) {
            this.logger.error(`Error getting product statistics: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Failed to retrieve product statistics');
        }
    }

    // Private helper methods
    private generateSlug(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }
}