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
    CreateBannerDto,
    UpdateBannerDto,
    BannerQueryDto,
    UpdateSortOrderDto,
} from './dto';
import { Banner, BannerDocument } from './scheme/banner.scheme';
import { Product, ProductDocument } from 'src/products/scheme/product.schem';
import { Category, CategoryDocument } from 'src/categories/scheme/category.scheme';
import { SubCategory, SubCategoryDocument } from 'src/sub-categories/scheme/sub-category.scheme';

@Injectable()
export class BannersService {
    private readonly logger = new Logger(BannersService.name);

    constructor(
        @InjectModel(Banner.name) private bannerModel: Model<BannerDocument>,
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
        @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
        @InjectModel(SubCategory.name) private subCategoryModel: Model<SubCategoryDocument>,
    ) { }

    // Create new banner
    async create(createBannerDto: CreateBannerDto, userId: string): Promise<Banner> {
        try {
            this.logger.log(`Creating banner with relationship: ${JSON.stringify(createBannerDto)}`);

            // Validate that exactly one relationship is provided
            const { productId, categoryId, subCategoryId } = createBannerDto;
            const relationshipCount = [productId, categoryId, subCategoryId].filter(Boolean).length;

            if (relationshipCount === 0) {
                throw new BadRequestException('At least one relationship (productId, categoryId, or subCategoryId) must be provided');
            }

            if (relationshipCount > 1) {
                throw new BadRequestException('Only one relationship (productId, categoryId, or subCategoryId) can be provided');
            }

            // Validate the specific relationship
            if (productId) {
                const product = await this.productModel.findById(productId).exec();
                if (!product || product.isDeleted) {
                    throw new NotFoundException('Product not found');
                }
            } else if (categoryId) {
                const category = await this.categoryModel.findById(categoryId).exec();
                if (!category || category.isDeleted) {
                    throw new NotFoundException('Category not found');
                }
            } else if (subCategoryId) {
                const subCategory = await this.subCategoryModel.findById(subCategoryId).exec();
                if (!subCategory || subCategory.isDeleted) {
                    throw new NotFoundException('SubCategory not found');
                }
            }

            const banner = new this.bannerModel({
                ...createBannerDto,
                createdBy: userId,
                updatedBy: userId,
            });

            const savedBanner = await banner.save();

            this.logger.log(`Banner created successfully: ${savedBanner._id}`);
            return savedBanner;
        } catch (error) {
            this.logger.error(`Error creating banner: ${error.message}`, error.stack);

            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }

            throw new InternalServerErrorException('Failed to create banner');
        }
    }

    // Find all banners with pagination and filtering
    async findAll(query: BannerQueryDto) {
        try {
            this.logger.log(`Finding banners with query: ${JSON.stringify(query)}`);
            const {
                page = 1,
                limit = 20,
                sort = 'sortOrder',
                isActive,
                productId,
                categoryId,
                subCategoryId,
                search,
            } = query;

            // Build filter
            const filter: any = { isDeleted: { $ne: true } };

            if (isActive !== undefined) filter.isActive = isActive;
            if (productId) filter.productId = productId;
            if (categoryId) filter.categoryId = categoryId;
            if (subCategoryId) filter.subCategoryId = subCategoryId;

            // Search filter
            if (search) {
                filter.$or = [
                    { image: { $regex: search, $options: 'i' } },
                ];
            }

            // Calculate pagination
            const skip = (page - 1) * limit;
            const total = await this.bannerModel.countDocuments(filter).exec();
            const pages = Math.ceil(total / limit);

            // Get banners
            const banners = await this.bannerModel
                .find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('product', 'name image price isActive')
                .populate('category', 'name image isActive')
                .populate('subCategory', 'name categoryId type isActive')
                .exec();

            this.logger.log(`Found ${banners.length} banners out of ${total} total`);
            return {
                data: banners,
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
            this.logger.error(`Error finding banners: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Failed to retrieve banners');
        }
    }

    // Find banner by ID
    async findById(id: string): Promise<Banner> {
        try {
            this.logger.log(`Finding banner by ID: ${id}`);

            const banner = await this.bannerModel
                .findById(id)
                .populate('product', 'name image price isActive')
                .populate('category', 'name image isActive')
                .populate('subCategory', 'name categoryId type isActive')
                .exec();

            if (!banner || banner.isDeleted) {
                throw new NotFoundException('Banner not found');
            }

            this.logger.log(`Banner found successfully: ${banner._id}`);
            return banner;
        } catch (error) {
            this.logger.error(`Error finding banner by ID ${id}: ${error.message}`, error.stack);

            if (error instanceof NotFoundException) {
                throw error;
            }

            throw new InternalServerErrorException('Failed to retrieve banner');
        }
    }

    // Update banner
    async update(id: string, updateBannerDto: UpdateBannerDto, userId: string): Promise<Banner> {
        try {
            this.logger.log(`Updating banner: ${id}`);

            // Validate relationships if being changed
            const { productId, categoryId, subCategoryId } = updateBannerDto;
            const relationshipCount = [productId, categoryId, subCategoryId].filter(Boolean).length;

            if (relationshipCount > 1) {
                throw new BadRequestException('Only one relationship (productId, categoryId, or subCategoryId) can be provided');
            }

            if (productId) {
                const product = await this.productModel.findById(productId).exec();
                if (!product || product.isDeleted) {
                    throw new NotFoundException('Product not found');
                }
            } else if (categoryId) {
                const category = await this.categoryModel.findById(categoryId).exec();
                if (!category || category.isDeleted) {
                    throw new NotFoundException('Category not found');
                }
            } else if (subCategoryId) {
                const subCategory = await this.subCategoryModel.findById(subCategoryId).exec();
                if (!subCategory || subCategory.isDeleted) {
                    throw new NotFoundException('SubCategory not found');
                }
            }

            const banner = await this.bannerModel
                .findByIdAndUpdate(
                    id,
                    { ...updateBannerDto, updatedBy: userId },
                    { new: true }
                )
                .populate('product', 'name image price isActive')
                .populate('category', 'name image isActive')
                .populate('subCategory', 'name categoryId type isActive')
                .exec();

            if (!banner || banner.isDeleted) {
                throw new NotFoundException('Banner not found');
            }

            this.logger.log(`Banner updated successfully: ${banner._id}`);
            return banner;
        } catch (error) {
            this.logger.error(`Error updating banner ${id}: ${error.message}`, error.stack);

            if (error instanceof NotFoundException) {
                throw error;
            }

            throw new InternalServerErrorException('Failed to update banner');
        }
    }

    // Toggle active status
    async toggleActive(id: string, userId: string): Promise<Banner> {
        try {
            this.logger.log(`Toggling active status for banner: ${id}`);

            const banner = await this.bannerModel.findById(id).exec();
            if (!banner || banner.isDeleted) {
                throw new NotFoundException('Banner not found');
            }

            banner.isActive = !banner.isActive;
            banner.updatedBy = userId as any;
            const savedBanner = await banner.save();

            this.logger.log(`Active status toggled successfully for banner: ${savedBanner._id}`);
            return savedBanner;
        } catch (error) {
            this.logger.error(`Error toggling active status for banner ${id}: ${error.message}`, error.stack);

            if (error instanceof NotFoundException) {
                throw error;
            }

            throw new InternalServerErrorException('Failed to toggle banner active status');
        }
    }

    // Update sort order
    async updateSortOrder(id: string, updateSortOrderDto: UpdateSortOrderDto, userId: string): Promise<Banner> {
        try {
            this.logger.log(`Updating sort order for banner: ${id}`);

            const banner = await this.bannerModel
                .findByIdAndUpdate(
                    id,
                    {
                        sortOrder: updateSortOrderDto.sortOrder,
                        updatedBy: userId
                    },
                    { new: true }
                )
                .populate('product', 'name image price isActive')
                .populate('category', 'name image isActive')
                .populate('subCategory', 'name categoryId type isActive')
                .exec();

            if (!banner || banner.isDeleted) {
                throw new NotFoundException('Banner not found');
            }

            this.logger.log(`Sort order updated successfully for banner: ${banner._id}`);
            return banner;
        } catch (error) {
            this.logger.error(`Error updating sort order for banner ${id}: ${error.message}`, error.stack);

            if (error instanceof NotFoundException) {
                throw error;
            }

            throw new InternalServerErrorException('Failed to update banner sort order');
        }
    }

    // Soft delete banner
    async remove(id: string, userId: string): Promise<void> {
        try {
            this.logger.log(`Soft deleting banner: ${id}`);

            const banner = await this.bannerModel.findById(id).exec();
            if (!banner || banner.isDeleted) {
                throw new NotFoundException('Banner not found');
            }

            await this.bannerModel
                .findByIdAndUpdate(id, {
                    isDeleted: true,
                    isActive: false,
                    updatedBy: userId,
                })
                .exec();

            this.logger.log(`Banner soft deleted successfully: ${banner._id}`);
        } catch (error) {
            this.logger.error(`Error soft deleting banner ${id}: ${error.message}`, error.stack);

            if (error instanceof NotFoundException) {
                throw error;
            }

            throw new InternalServerErrorException('Failed to delete banner');
        }
    }

    // Get active banners (for public API)
    async getActiveBanners(limit: number = 10) {
        try {
            this.logger.log(`Getting active banners with limit: ${limit}`);

            const banners = await this.bannerModel
                .find({
                    isActive: true,
                    isDeleted: { $ne: true }
                })
                .sort({ sortOrder: 1, createdAt: -1 })
                .limit(limit)
                .populate('product', 'name image price isActive')
                .populate('category', 'name image isActive')
                .populate('subCategory', 'name categoryId type isActive')
                .exec();

            this.logger.log(`Found ${banners.length} active banners`);
            return banners;
        } catch (error) {
            this.logger.error(`Error getting active banners: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Failed to retrieve active banners');
        }
    }

    // Get banner statistics
    async getBannerStats() {
        try {
            this.logger.log('Getting banner statistics');

            const totalBanners = await this.bannerModel
                .countDocuments({ isDeleted: { $ne: true } })
                .exec();

            const activeBanners = await this.bannerModel
                .countDocuments({ isActive: true, isDeleted: { $ne: true } })
                .exec();

            this.logger.log(`Banner statistics retrieved successfully`);
            return {
                totalBanners,
                activeBanners,
                inactiveBanners: totalBanners - activeBanners,
            };
        } catch (error) {
            this.logger.error(`Error getting banner statistics: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Failed to retrieve banner statistics');
        }
    }
}
