import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from '../categories/scheme/category.scheme';

@Injectable()
export class CategoriesSeedService {
    constructor(
        @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    ) { }

    async seed() {
        try {
            console.log('🌱 Starting categories seeding...');

            // Check if categories already exist
            const existingCategories = await this.categoryModel.countDocuments();
            if (existingCategories > 0) {
                console.log('⚠️  Categories already exist, skipping seeding...');
                return;
            }

            const categories = [
                {
                    name: 'Electronics',
                    nameAr: 'إلكترونيات',
                    description: 'Electronic devices and gadgets',
                    descriptionAr: 'الأجهزة الإلكترونية والملحقات',
                    isFeatured: true,
                    icon: '🔌',
                    color: '#3B82F6',
                    slug: 'electronics',
                },
                {
                    name: 'Smartphones',
                    nameAr: 'هواتف ذكية',
                    description: 'Mobile phones and smartphones',
                    descriptionAr: 'الهواتف المحمولة والهواتف الذكية',
                    isFeatured: true,
                    icon: '📱',
                    color: '#10B981',
                    slug: 'smartphones',
                },
                {
                    name: 'Computers & Laptops',
                    nameAr: 'حواسيب ومحمولة',
                    description: 'Desktop computers and laptops',
                    descriptionAr: 'الحواسيب المكتبية والمحمولة',
                    isFeatured: true,
                    icon: '💻',
                    color: '#8B5CF6',
                    slug: 'computers-laptops',
                },
                {
                    name: 'Audio & Speakers',
                    nameAr: 'صوت ومكبرات صوت',
                    description: 'Audio equipment and speakers',
                    descriptionAr: 'معدات الصوت ومكبرات الصوت',
                    isFeatured: false,
                    icon: '🔊',
                    color: '#F59E0B',
                    slug: 'audio-speakers',
                },
                {
                    name: 'Gaming',
                    nameAr: 'ألعاب',
                    description: 'Gaming consoles and accessories',
                    descriptionAr: 'أجهزة الألعاب والملحقات',
                    isFeatured: false,
                    icon: '🎮',
                    color: '#EF4444',
                    slug: 'gaming',
                },
                {
                    name: 'Cameras & Photography',
                    nameAr: 'كاميرات وتصوير',
                    description: 'Cameras and photography equipment',
                    descriptionAr: 'الكاميرات ومعدات التصوير',
                    isFeatured: false,
                    icon: '📷',
                    color: '#06B6D4',
                    slug: 'cameras-photography',
                },
                {
                    name: 'Home Appliances',
                    nameAr: 'أجهزة منزلية',
                    description: 'Home and kitchen appliances',
                    descriptionAr: 'الأجهزة المنزلية والمطبخية',
                    isFeatured: false,
                    icon: '🏠',
                    color: '#84CC16',
                    slug: 'home-appliances',
                },
                {
                    name: 'Accessories',
                    nameAr: 'ملحقات',
                    description: 'Various electronic accessories',
                    descriptionAr: 'ملحقات إلكترونية متنوعة',
                    isFeatured: false,
                    icon: '🔧',
                    color: '#6B7280',
                    slug: 'accessories',
                },
            ];

            const createdCategories = await this.categoryModel.insertMany(categories);

            console.log('✅ Categories seeded successfully!');
            console.log('📋 Created Categories:');
            createdCategories.forEach((category) => {
                console.log(`   ${category.icon} ${category.name} (${category.nameAr})`);
            });

            return createdCategories;
        } catch (error) {
            console.error('❌ Error seeding categories:', error);
            throw error;
        }
    }

    async clear() {
        try {
            console.log('🧹 Clearing categories...');
            await this.categoryModel.deleteMany({});
            console.log('✅ Categories cleared successfully!');
        } catch (error) {
            console.error('❌ Error clearing categories:', error);
            throw error;
        }
    }
}
