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

        const category = new this.categoryModel({
            ...createCategoryDto,
            createdBy: userId,
            updatedBy: userId,
        });

        const savedCategory = await category.save();

        return savedCategory;
    }

    // Find all categories with pagination
    async findAll(query: CategoryQueryDto) {
        const {
            page = 1,
            limit = 20,
            sort = 'sortOrder',

            isActive,
            isFeatured,
            rootOnly,
            search,
        } = query;

        // Build filter
        const filter: any = { isDeleted: { $ne: true } };


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





    // Update category
    async update(id: string, updateCategoryDto: UpdateCategoryDto, userId: string): Promise<Category> {

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


        // Check if category has products
        if (category.productCount > 0) {
            throw new BadRequestException('Cannot delete category with products');
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



}