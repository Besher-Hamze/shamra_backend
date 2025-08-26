import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
    CreateCategoryDto,
    UpdateCategoryDto,
    CategoryQueryDto,
} from './dto';
import { Category, CategoryDocument } from './scheme/category.scheme';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    ) { }

    // Create new category
    async create(createCategoryDto: CreateCategoryDto, userId: string): Promise<Category> {
        const { name, slug, parentId } = createCategoryDto;

        // Generate slug if not provided
        let finalSlug = slug || this.generateSlug(name);

        // Check if slug already exists
        const existingCategory = await this.categoryModel.findOne({ slug: finalSlug }).exec();
        if (existingCategory) {
            finalSlug = `${finalSlug}-${Date.now()}`;
        }

        // Validate parent category if provided
        if (parentId) {
            const parentCategory = await this.categoryModel.findById(parentId).exec();
            if (!parentCategory || parentCategory.isDeleted) {
                throw new NotFoundException('Parent category not found');
            }
        }

        const category = new this.categoryModel({
            ...createCategoryDto,
            slug: finalSlug,
            createdBy: userId,
            updatedBy: userId,
        });

        const savedCategory = await category.save();

        // Update parent's children array
        if (parentId) {
            await this.categoryModel
                .findByIdAndUpdate(parentId, {
                    $addToSet: { children: savedCategory._id },
                })
                .exec();
        }

        return savedCategory;
    }

    // Find all categories with pagination
    async findAll(query: CategoryQueryDto) {
        const {
            page = 1,
            limit = 20,
            sort = 'sortOrder',
            parentId,
            isActive,
            isFeatured,
            rootOnly,
            withChildren,
            search,
        } = query;

        // Build filter
        const filter: any = { isDeleted: { $ne: true } };

        if (parentId !== undefined) {
            filter.parentId = parentId === 'null' ? null : parentId;
        }

        if (rootOnly) {
            filter.parentId = null;
        }

        if (isActive !== undefined) filter.isActive = isActive;
        if (isFeatured !== undefined) filter.isFeatured = isFeatured;

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { nameAr: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { descriptionAr: { $regex: search, $options: 'i' } },
            ];
        }

        // Calculate pagination
        const skip = (page - 1) * limit;
        const total = await this.categoryModel.countDocuments(filter).exec();
        const pages = Math.ceil(total / limit);

        // Build query
        let categoriesQuery = this.categoryModel
            .find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate('createdBy', 'firstName lastName')
            .populate('updatedBy', 'firstName lastName');

        // Populate children if requested
        if (withChildren) {
            categoriesQuery = categoriesQuery.populate('children', 'name nameAr slug isActive');
        }

        const categories = await categoriesQuery.exec();

        return {
            data: categories,
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

    // Find category by ID
    async findById(id: string, withChildren = false): Promise<Category> {
        let query = this.categoryModel.findById(id).populate('createdBy', 'firstName lastName');

        if (withChildren) {
            query = query.populate('children', 'name nameAr slug isActive sortOrder');
        }

        const category = await query.exec();

        if (!category || category.isDeleted) {
            throw new NotFoundException('Category not found');
        }

        return category;
    }

    // Find category by slug
    async findBySlug(slug: string, withChildren = false): Promise<Category> {
        let query = this.categoryModel.findOne({ slug, isDeleted: { $ne: true } });

        if (withChildren) {
            query = query.populate('children', 'name nameAr slug isActive sortOrder');
        }

        const category = await query.exec();

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        return category;
    }

    // Get category tree (hierarchical structure)
    async getCategoryTree(): Promise<any[]> {
        const categories = await this.categoryModel
            .find({ isDeleted: { $ne: true }, isActive: true })
            .sort('sortOrder')
            .exec();

        return this.buildCategoryTree(categories);
    }

    // Update category
    async update(id: string, updateCategoryDto: UpdateCategoryDto, userId: string): Promise<Category> {
        const { slug, parentId } = updateCategoryDto;

        // Check if slug is being changed and if it's already taken
        if (slug) {
            const existingCategory = await this.categoryModel
                .findOne({ slug, _id: { $ne: id } })
                .exec();
            if (existingCategory) {
                throw new ConflictException('Slug already taken by another category');
            }
        }

        // Validate parent category if being changed
        if (parentId !== undefined) {
            if (parentId) {
                const parentCategory = await this.categoryModel.findById(parentId).exec();
                if (!parentCategory || parentCategory.isDeleted) {
                    throw new NotFoundException('Parent category not found');
                }

                // Prevent circular reference
                if (parentId === id) {
                    throw new BadRequestException('Category cannot be its own parent');
                }
            }

            // Update previous parent's children array
            const currentCategory = await this.categoryModel.findById(id).exec();
            if (currentCategory && currentCategory.parentId) {
                await this.categoryModel
                    .findByIdAndUpdate(currentCategory.parentId, {
                        $pull: { children: id },
                    })
                    .exec();
            }

            // Update new parent's children array
            if (parentId) {
                await this.categoryModel
                    .findByIdAndUpdate(parentId, {
                        $addToSet: { children: id },
                    })
                    .exec();
            }
        }

        const category = await this.categoryModel
            .findByIdAndUpdate(
                id,
                { ...updateCategoryDto, updatedBy: userId },
                { new: true }
            )
            .exec();

        if (!category || category.isDeleted) {
            throw new NotFoundException('Category not found');
        }

        return category;
    }

    // Soft delete category
    async remove(id: string, userId: string): Promise<void> {
        const category = await this.categoryModel.findById(id).exec();
        if (!category || category.isDeleted) {
            throw new NotFoundException('Category not found');
        }

        // Check if category has children
        if (category.children && category.children.length > 0) {
            throw new BadRequestException('Cannot delete category with children');
        }

        // Check if category has products
        if (category.productCount > 0) {
            throw new BadRequestException('Cannot delete category with products');
        }

        // Remove from parent's children array
        if (category.parentId) {
            await this.categoryModel
                .findByIdAndUpdate(category.parentId, {
                    $pull: { children: id },
                })
                .exec();
        }

        await this.categoryModel
            .findByIdAndUpdate(id, {
                isDeleted: true,
                isActive: false,
                updatedBy: userId,
            })
            .exec();
    }

    // Toggle active status
    async toggleActive(id: string, userId: string): Promise<Category> {
        const category = await this.categoryModel.findById(id).exec();
        if (!category || category.isDeleted) {
            throw new NotFoundException('Category not found');
        }

        category.isActive = !category.isActive;
        category.updatedBy = userId as any;
        return await category.save();
    }

    // Update sort order
    async updateSortOrder(id: string, sortOrder: number, userId: string): Promise<Category> {
        const category = await this.categoryModel
            .findByIdAndUpdate(
                id,
                { sortOrder, updatedBy: userId },
                { new: true }
            )
            .exec();

        if (!category || category.isDeleted) {
            throw new NotFoundException('Category not found');
        }

        return category;
    }

    // Get category statistics
    async getCategoryStats() {
        const totalCategories = await this.categoryModel
            .countDocuments({ isDeleted: { $ne: true } })
            .exec();

        const activeCategories = await this.categoryModel
            .countDocuments({ isActive: true, isDeleted: { $ne: true } })
            .exec();

        const featuredCategories = await this.categoryModel
            .countDocuments({ isFeatured: true, isDeleted: { $ne: true } })
            .exec();

        const rootCategories = await this.categoryModel
            .countDocuments({ parentId: null, isDeleted: { $ne: true } })
            .exec();

        const recentCategories = await this.categoryModel
            .find({ isDeleted: { $ne: true } })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name nameAr isActive createdAt')
            .exec();

        return {
            totalCategories,
            activeCategories,
            inactiveCategories: totalCategories - activeCategories,
            featuredCategories,
            rootCategories,
            recentCategories,
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

    private buildCategoryTree(categories: Category[], parentId: any = null): any[] {
        const tree: any[] = [];

        const parentCategories = categories.filter(
            (cat) => String(cat.parentId) === String(parentId),
        );

        for (const parent of parentCategories) {
            const children = this.buildCategoryTree(categories, parent._id);
            const treeItem = {
                ...parent,
                childrenData: children,
                level: parentId === null ? 0 : 1,
                hasChildren: children.length > 0,
            };
            tree.push(treeItem);
        }

        return tree;
    }
}