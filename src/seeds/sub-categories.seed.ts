import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SubCategory, SubCategoryDocument } from '../sub-categories/scheme/sub-category.scheme';
import { Category, CategoryDocument } from '../categories/scheme/category.scheme';

@Injectable()
export class SubCategoriesSeedService {
    constructor(
        @InjectModel(SubCategory.name) private subCategoryModel: Model<SubCategoryDocument>,
        @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    ) { }

    async seed() {
        try {
            console.log('🌱 Starting sub-categories seeding...');

            // Check if sub-categories already exist
            const existingSubCategories = await this.subCategoryModel.countDocuments();
            if (existingSubCategories > 0) {
                console.log('⚠️  Sub-categories already exist, skipping seeding...');
                return;
            }

            // Get categories for reference
            const categories = await this.categoryModel.find();
            if (categories.length === 0) {
                console.log('⚠️  No categories found. Please seed categories first.');
                return;
            }

            const subCategories = [
                // Smartphones sub-categories
                {
                    name: 'iPhone',
                    nameAr: 'آيفون',
                    categoryId: categories.find(c => c.name === 'Smartphones')?._id.toString(),
                    isActive: true,
                },
                {
                    name: 'LG',
                    nameAr: 'إل جي',
                    categoryId: categories.find(c => c.name === 'Smartphones')?._id.toString(),
                    isActive: true,
                },
                {
                    name: 'Samsung',
                    nameAr: 'سامسونج',
                    categoryId: categories.find(c => c.name === 'Smartphones')?._id.toString(),
                    isActive: true,
                },
                {
                    name: 'Android Phones',
                    nameAr: 'هواتف أندرويد',
                    categoryId: categories.find(c => c.name === 'Smartphones')?._id.toString(),
                    isActive: true,
                },

                // Computers & Laptops sub-categories
                {
                    name: 'MacBooks',
                    nameAr: 'ماك بوك',
                    categoryId: categories.find(c => c.name === 'Computers & Laptops')?._id.toString(),
                    isActive: true,
                },
                {
                    name: 'Windows Laptops',
                    nameAr: 'لابتوب ويندوز',
                    categoryId: categories.find(c => c.name === 'Computers & Laptops')?._id.toString(),
                    isActive: true,
                },
                {
                    name: 'Desktop PCs',
                    nameAr: 'حواسيب مكتبية',
                    categoryId: categories.find(c => c.name === 'Computers & Laptops')?._id.toString(),
                    isActive: true,
                },

                // Gaming sub-categories
                {
                    name: 'PlayStation',
                    nameAr: 'بلاي ستيشن',
                    categoryId: categories.find(c => c.name === 'Gaming')?._id.toString(),
                    isActive: true,
                },
                {
                    name: 'Xbox',
                    nameAr: 'إكس بوكس',
                    categoryId: categories.find(c => c.name === 'Gaming')?._id.toString(),
                    isActive: true,
                },
                {
                    name: 'Nintendo',
                    nameAr: 'نينتندو',
                    categoryId: categories.find(c => c.name === 'Gaming')?._id.toString(),
                    isActive: true,
                },
                {
                    name: 'Canon',
                    nameAr: 'كانون',
                    categoryId: categories.find(c => c.name === 'Cameras & Photography')?._id.toString(),
                    isActive: true,
                },

            ];

            const createdSubCategories = await this.subCategoryModel.insertMany(subCategories);

            console.log('✅ Sub-categories seeded successfully!');
            console.log('📋 Created Sub-categories:');
            createdSubCategories.forEach((subCategory) => {
                console.log(`   📱 ${subCategory.name} (${subCategory.nameAr})`);
            });

            return createdSubCategories;
        } catch (error) {
            console.error('❌ Error seeding sub-categories:', error);
            throw error;
        }
    }

    async clear() {
        try {
            console.log('🧹 Clearing sub-categories...');
            await this.subCategoryModel.deleteMany({});
            console.log('✅ Sub-categories cleared successfully!');
        } catch (error) {
            console.error('❌ Error clearing sub-categories:', error);
            throw error;
        }
    }
}
