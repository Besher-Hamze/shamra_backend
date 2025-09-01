import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
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

@Injectable()
export class ProductsService {
    constructor(
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
        @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
        @InjectModel(SubCategory.name) private subCategoryModel: Model<SubCategoryDocument>,
        @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
    ) { }

    // Create new product
    async create(createProductDto: CreateProductDto, userId: string): Promise<Product> {
        const { sku, slug, categoryId, subCategoryId, branchId } = createProductDto;

        // Check if SKU already exists
        if (sku) {
            const existingProduct = await this.productModel.findOne({ sku }).exec();
            if (existingProduct) {
                throw new ConflictException('Product with this SKU already exists');
            }
        }

        // Generate slug if not provided
        let finalSlug = slug || this.generateSlug(createProductDto.name);

        // Ensure slug uniqueness
        const existingSlug = await this.productModel.findOne({ slug: finalSlug }).exec();
        if (existingSlug) {
            finalSlug = `${finalSlug}-${Date.now()}`;
        }

        // Validate category
        const category = await this.categoryModel.findById(categoryId).exec();
        if (!category || category.isDeleted || !category.isActive) {
            throw new NotFoundException('Category not found or inactive');
        }

        // Validate subcategory if provided
        if (subCategoryId) {
            const subCategory = await this.subCategoryModel.findById(subCategoryId).exec();
            if (!subCategory || subCategory.isDeleted || !subCategory.isActive) {
                throw new NotFoundException('SubCategory not found or inactive');
            }
            // Ensure subcategory belongs to the specified category
            if (subCategory.categoryId.toString() !== categoryId) {
                throw new BadRequestException('SubCategory does not belong to the specified category');
            }
        }

        // Validate branch
        const branch = await this.branchModel.findById(branchId).exec();
        if (!branch || branch.isDeleted || !branch.isActive) {
            throw new NotFoundException('Branch not found or inactive');
        }

        const product = new this.productModel({
            ...createProductDto,
            slug: finalSlug,
            createdBy: userId,
            updatedBy: userId,
        });

        const savedProduct = await product.save();

        // Update category product count
        await this.categoryModel
            .findByIdAndUpdate(categoryId, { $inc: { productCount: 1 } })
            .exec();

        return savedProduct;
    }

    // Find all products with pagination and filtering
    async findAll(query: ProductQueryDto) {
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
        } = query;

        // Build filter
        const filter: any = { isDeleted: { $ne: true } };

        if (categoryId) filter.categoryId = categoryId;
        if (subCategoryId) filter.subCategoryId = subCategoryId;
        if (brand) filter.brand = { $regex: brand, $options: 'i' };
        if (status) filter.status = status;
        if (isActive !== undefined) filter.isActive = isActive;
        if (isFeatured !== undefined) filter.isFeatured = isFeatured;
        if (isOnSale !== undefined) filter.isOnSale = isOnSale;

        // Price range filter
        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {};
            if (minPrice !== undefined) filter.price.$gte = minPrice;
            if (maxPrice !== undefined) filter.price.$lte = maxPrice;
        }

        // Tags filter
        if (tags && tags.length > 0) {
            filter.tags = { $in: tags };
        }

        // Search filter
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { nameAr: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } },
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
            .populate('categoryId', 'name nameAr slug')
            .populate('subCategoryId', 'name nameAr')
            .populate('additionalCategories', 'name nameAr slug')
            .populate('createdBy', 'firstName lastName')
            .populate('branchId', 'name nameAr')
            .exec();

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
    }

    // Find product by ID
    async findById(id: string): Promise<Product> {
        const product = await this.productModel
            .findById(id)
            .populate('categoryId', 'name nameAr slug')
            .populate('subCategoryId', 'name nameAr')
            .populate('additionalCategories', 'name nameAr slug')
            .populate('createdBy', 'firstName lastName')
            .populate('updatedBy', 'firstName lastName')
            .populate('branchId', 'name nameAr')
            .exec();

        if (!product || product.isDeleted) {
            throw new NotFoundException('Product not found');
        }

        // Increment view count
        await this.productModel
            .findByIdAndUpdate(id, { $inc: { viewCount: 1 } })
            .exec();

        return product;
    }

    // Find product by SKU
    async findBySku(sku: string): Promise<Product> {
        const product = await this.productModel
            .findOne({ sku, isDeleted: { $ne: true } })
            .populate('categoryId', 'name nameAr slug')
            .populate('branchId', 'name nameAr')
            .exec();

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        return product;
    }

    // Find product by slug
    async findBySlug(slug: string): Promise<Product> {
        const product = await this.productModel
            .findOne({ slug, isDeleted: { $ne: true } })
            .populate('categoryId', 'name nameAr slug')
            .populate('additionalCategories', 'name nameAr slug')
            .populate('branchId', 'name nameAr')
            .exec();

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        // Increment view count
        await this.productModel
            .findByIdAndUpdate(product._id, { $inc: { viewCount: 1 } })
            .exec();

        return product;
    }

    // Update product
    async update(id: string, updateProductDto: UpdateProductDto, userId: string): Promise<Product> {
        const { sku, slug, categoryId } = updateProductDto;

        // Check if SKU is being changed and if it's already taken
        if (sku) {
            const existingProduct = await this.productModel
                .findOne({ sku, _id: { $ne: id } })
                .exec();
            if (existingProduct) {
                throw new ConflictException('SKU already taken by another product');
            }
        }

        // Check if slug is being changed and if it's already taken
        if (slug) {
            const existingProduct = await this.productModel
                .findOne({ slug, _id: { $ne: id } })
                .exec();
            if (existingProduct) {
                throw new ConflictException('Slug already taken by another product');
            }
        }

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
            .populate('categoryId', 'name nameAr slug')
            .populate('additionalCategories', 'name nameAr slug')
            .populate('branchId', 'name nameAr')
            .exec();

        if (!product || product.isDeleted) {
            throw new NotFoundException('Product not found');
        }

        return product;
    }

    // Update stock quantity
    async updateStock(id: string, updateStockDto: UpdateStockDto, userId: string): Promise<Product> {
        const product = await this.productModel
            .findByIdAndUpdate(
                id,
                {
                    stockQuantity: updateStockDto.stockQuantity,
                    updatedBy: userId
                },
                { new: true }
            )
            .populate('branchId', 'name nameAr')
            .exec();

        if (!product || product.isDeleted) {
            throw new NotFoundException('Product not found');
        }

        return product;
    }

    // Update product prices
    async updatePrice(id: string, updatePriceDto: UpdatePriceDto, userId: string): Promise<Product> {
        const product = await this.productModel
            .findByIdAndUpdate(
                id,
                { ...updatePriceDto, updatedBy: userId },
                { new: true }
            )
            .populate('branchId', 'name nameAr')
            .exec();

        if (!product || product.isDeleted) {
            throw new NotFoundException('Product not found');
        }

        return product;
    }

    // Toggle active status
    async toggleActive(id: string, userId: string): Promise<Product> {
        const product = await this.productModel.findById(id).exec();
        if (!product || product.isDeleted) {
            throw new NotFoundException('Product not found');
        }

        product.isActive = !product.isActive;
        product.updatedBy = userId as any;
        return await product.save();
    }

    // Toggle featured status
    async toggleFeatured(id: string, userId: string): Promise<Product> {
        const product = await this.productModel.findById(id).exec();
        if (!product || product.isDeleted) {
            throw new NotFoundException('Product not found');
        }

        product.isFeatured = !product.isFeatured;
        product.updatedBy = userId as any;
        return await product.save();
    }

    // Soft delete product
    async remove(id: string, userId: string): Promise<void> {
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
    }

    // Get featured products
    async getFeatured(limit: number = 10) {
        const products = await this.productModel
            .find({
                isFeatured: true,
                isActive: true,
                isDeleted: { $ne: true }
            })
            .limit(limit)
            .sort({ sortOrder: 1, createdAt: -1 })
            .populate('categoryId', 'name nameAr slug')
            .populate('branchId', 'name nameAr')
            .exec();

        return products;
    }

    // Get products on sale
    async getOnSale(limit: number = 20) {
        const products = await this.productModel
            .find({
                isOnSale: true,
                isActive: true,
                isDeleted: { $ne: true }
            })
            .limit(limit)
            .sort({ createdAt: -1 })
            .populate('categoryId', 'name nameAr slug')
            .populate('branchId', 'name nameAr')
            .exec();

        return products;
    }

    // Get low stock products
    async getLowStock(limit: number = 50) {
        const products = await this.productModel
            .find({
                $expr: { $lte: ['$stockQuantity', '$minStockLevel'] },
                isActive: true,
                isDeleted: { $ne: true }
            })
            .limit(limit)
            .sort({ stockQuantity: 1 })
            .populate('categoryId', 'name nameAr slug')
            .populate('branchId', 'name nameAr')
            .exec();

        return products;
    }

    // Get product statistics
    async getProductStats() {
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
            .countDocuments({ isOnSale: true, isDeleted: { $ne: true } })
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
            .select('name nameAr sku totalSales')
            .exec();

        // Most viewed products
        const mostViewed = await this.productModel
            .find({ isDeleted: { $ne: true } })
            .sort({ viewCount: -1 })
            .limit(5)
            .select('name nameAr sku viewCount')
            .exec();

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