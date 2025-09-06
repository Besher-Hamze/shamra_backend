import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../products/scheme/product.schem';
import { Category, CategoryDocument } from '../categories/scheme/category.scheme';
import { SubCategory, SubCategoryDocument } from '../sub-categories/scheme/sub-category.scheme';
import { Branch, BranchDocument } from '../branches/scheme/branche.scheme';

@Injectable()
export class ProductsSeedService {
    constructor(
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
        @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
        @InjectModel(SubCategory.name) private subCategoryModel: Model<SubCategoryDocument>,
        @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
    ) { }

    async seed() {
        try {
            console.log('🌱 Starting products seeding...');

            // Check if products already exist
            const existingProducts = await this.productModel.countDocuments();
            if (existingProducts > 0) {
                console.log('⚠️  Products already exist, skipping seeding...');
                return;
            }

            // Get categories for reference
            const categories = await this.categoryModel.find();
            if (categories.length === 0) {
                console.log('⚠️  No categories found. Please seed categories first.');
                return;
            }

            // Get sub-categories for reference
            const subCategories = await this.subCategoryModel.find();
            if (subCategories.length === 0) {
                console.log('⚠️  No sub-categories found. Please seed sub-categories first.');
                return;
            }
            let defaultBranch = await this.branchModel.findOne({ name: 'Main Branch' });
            if (!defaultBranch) {
                console.log('⚠️  No branch found. Please seed branch first.');
                return;
            }


            const products = [
                // Smartphones
                {
                    name: 'iPhone 15 Pro',
                    description: 'Latest iPhone with advanced features and titanium design',
                    price: 8500000,
                    costPrice: 7000000,
                    categoryId: categories.find(c => c.name === 'Smartphones')?._id.toString(),
                    subCategoryId: subCategories.find(sc => sc.name === 'iPhone')?._id.toString(),
                    branches: [defaultBranch._id],
                    brand: 'Apple',
                    model: 'iPhone 15 Pro',
                    stockQuantity: 25,
                    isFeatured: true,
                    isActive: true,
                    images: ['/uploads/products/5b33d7f7-29ee-4207-9202-e0c483857e4c.jpg'],
                    mainImage: '/uploads/products/5b33d7f7-29ee-4207-9202-e0c483857e4c.jpg',
                    specifications: {
                        screen: '6.1 inch OLED',
                        processor: 'A17 Pro',
                        storage: '128GB',
                        color: 'Titanium',
                    },
                    tags: ['smartphone', 'apple', '5g', 'camera'],
                    slug: 'iphone-15-pro',
                },
                {
                    name: 'Samsung Galaxy S24 Ultra',
                    description: 'Premium Android smartphone with S Pen and AI features',
                    price: 7500000,
                    costPrice: 6000000,
                    categoryId: categories.find(c => c.name === 'Smartphones')?._id.toString(),
                    subCategoryId: subCategories.find(sc => sc.name === 'Samsung')?._id.toString(),
                    branches: [defaultBranch._id],
                    brand: 'Samsung',
                    model: 'Galaxy S24 Ultra',
                    stockQuantity: 30,
                    isFeatured: true,
                    isActive: true,
                    images: ['/uploads/products/5b33d7f7-29ee-4207-9202-e0c483857e4c.jpg'],
                    mainImage: '/uploads/products/5b33d7f7-29ee-4207-9202-e0c483857e4c.jpg',
                    specifications: {
                        screen: '6.8 inch Dynamic AMOLED',
                        processor: 'Snapdragon 8 Gen 3',
                        storage: '256GB',
                        color: 'Titanium Gray',
                    },
                    tags: ['smartphone', 'samsung', '5g', 'spen'],
                    slug: 'samsung-galaxy-s24-ultra',
                },
                // Computers & Laptops
                {
                    name: 'MacBook Pro 16" M3 Pro',
                    description: 'Professional laptop with M3 Pro chip for creative work',
                    price: 15000000,
                    costPrice: 12000000,
                    categoryId: categories.find(c => c.name === 'Computers & Laptops')?._id.toString(),
                    subCategoryId: subCategories.find(sc => sc.name === 'MacBooks')?._id.toString(),
                    branches: [defaultBranch._id],
                    brand: 'Apple',
                    model: 'MacBook Pro 16" M3 Pro',
                    stockQuantity: 15,
                    isFeatured: true,
                    isActive: true,
                    images: ['/uploads/products/5b33d7f7-29ee-4207-9202-e0c483857e4c.jpg'],
                    mainImage: '/uploads/products/5b33d7f7-29ee-4207-9202-e0c483857e4c.jpg',
                    specifications: {
                        screen: '16 inch Liquid Retina XDR',
                        processor: 'M3 Pro',
                        storage: '512GB SSD',
                        memory: '18GB Unified Memory',
                    },
                    tags: ['laptop', 'apple', 'macbook', 'creative'],
                    slug: 'macbook-pro-16-m3-pro',
                },
                {
                    name: 'Dell XPS 15',
                    description: 'Premium Windows laptop with OLED display and RTX graphics',
                    price: 12000000,
                    costPrice: 9500000,
                    categoryId: categories.find(c => c.name === 'Computers & Laptops')?._id.toString(),
                    subCategoryId: subCategories.find(sc => sc.name === 'Windows Laptops')?._id.toString(),
                    branches: [defaultBranch._id],
                    brand: 'Dell',
                    model: 'XPS 15',
                    stockQuantity: 20,
                    isFeatured: false,
                    isActive: true,
                    images: ['/uploads/products/5b33d7f7-29ee-4207-9202-e0c483857e4c.jpg'],
                    mainImage: '/uploads/products/5b33d7f7-29ee-4207-9202-e0c483857e4c.jpg',
                    specifications: {
                        screen: '15.6 inch 4K OLED',
                        processor: 'Intel Core i9-13900H',
                        storage: '1TB SSD',
                        graphics: 'RTX 4070',
                    },
                    tags: ['laptop', 'dell', 'windows', 'gaming'],
                    slug: 'dell-xps-15',
                },
                // Audio & Speakers
                {
                    name: 'Sony WH-1000XM5',
                    description: 'Premium noise-cancelling wireless headphones',
                    price: 2800000,
                    costPrice: 2200000,
                    categoryId: categories.find(c => c.name === 'Audio & Speakers')?._id.toString(),
                    subCategoryId: subCategories.find(sc => sc.name === 'PlayStation')?._id.toString(),
                    branches: [defaultBranch._id],
                    brand: 'Sony',
                    model: 'WH-1000XM5',
                    stockQuantity: 40,
                    isFeatured: true,
                    isActive: true,
                    images: ['/uploads/products/5b33d7f7-29ee-4207-9202-e0c483857e4c.jpg'],
                    mainImage: '/uploads/products/5b33d7f7-29ee-4207-9202-e0c483857e4c.jpg',
                    specifications: {
                        type: 'Over-ear',
                        connectivity: 'Bluetooth 5.2',
                        battery: '30 hours',
                        weight: '250g',
                    },
                    tags: ['headphones', 'sony', 'wireless', 'noise-cancelling'],
                    slug: 'sony-wh-1000xm5',
                },
                // Gaming
                {
                    name: 'PlayStation 5',
                    description: 'Next-generation gaming console with 4K graphics',
                    price: 4500000,
                    costPrice: 3500000,
                    categoryId: categories.find(c => c.name === 'Gaming')?._id.toString(),
                    subCategoryId: subCategories.find(sc => sc.name === 'PlayStation')?._id.toString(),
                    branches: [defaultBranch._id],
                    brand: 'Sony',
                    model: 'PlayStation 5',
                    stockQuantity: 35,
                    isFeatured: true,
                    isActive: true,
                    images: ['/uploads/products/5b33d7f7-29ee-4207-9202-e0c483857e4c.jpg'],
                    mainImage: '/uploads/products/5b33d7f7-29ee-4207-9202-e0c483857e4c.jpg',
                    specifications: {
                        storage: '825GB SSD',
                        resolution: '4K',
                        fps: 'Up to 120fps',
                        controller: 'DualSense',
                    },
                    tags: ['gaming', 'console', 'sony', '4k'],
                },
                // Cameras
                {
                    name: 'Canon EOS R6 Mark II',
                    description: 'Full-frame mirrorless camera for professional photography',
                    price: 8500000,
                    costPrice: 6800000,
                    categoryId: categories.find(c => c.name === 'Cameras & Photography')?._id.toString(),
                    subCategoryId: subCategories.find(sc => sc.name === 'Canon')?._id.toString(),
                    branches: [defaultBranch._id],
                    brand: 'Canon',
                    model: 'EOS R6 Mark II',
                    stockQuantity: 18,
                    isFeatured: false,
                    isActive: true,
                    images: ['/uploads/products/5b33d7f7-29ee-4207-9202-e0c483857e4c.jpg'],
                    mainImage: '/uploads/products/5b33d7f7-29ee-4207-9202-e0c483857e4c.jpg',
                    specifications: {
                        sensor: '24.2MP Full-frame',
                        video: '4K 60fps',
                        autofocus: 'Dual Pixel CMOS AF II',
                        stabilization: '5-axis IBIS',
                    },
                    tags: ['camera', 'canon', 'mirrorless', 'professional'],
                },
                // Home Appliances
                {
                    name: 'LG OLED TV 65" C3',
                    description: 'Premium OLED TV with AI processing and gaming features',
                    price: 12000000,
                    costPrice: 9500000,
                    categoryId: categories.find(c => c.name === 'Home Appliances')?._id.toString(),
                    subCategoryId: subCategories.find(sc => sc.name === 'LG')?._id.toString(),
                    branches: [defaultBranch._id],
                    brand: 'LG',
                    model: 'OLED65C3',
                    stockQuantity: 12,
                    isFeatured: true,
                    isActive: true,
                    images: ['/uploads/products/5b33d7f7-29ee-4207-9202-e0c483857e4c.jpg'],
                    mainImage: '/uploads/products/5b33d7f7-29ee-4207-9202-e0c483857e4c.jpg',
                    specifications: {
                        screen: '65 inch OLED',
                        resolution: '4K Ultra HD',
                        hdr: 'Dolby Vision HDR',
                        gaming: '120Hz, VRR, ALLM',
                    },
                    tags: ['tv', 'lg', 'oled', '4k', 'gaming'],
                },
            ];

            const createdProducts = await this.productModel.insertMany(products);

            console.log('✅ Products seeded successfully!');
            console.log('📋 Created Products:');
            createdProducts.forEach((product) => {
                console.log(`   📱 ${product.name} - ${product.brand} ${product.model}`);
            });

            return createdProducts;
        } catch (error) {
            console.error('❌ Error seeding products:', error);
            throw error;
        }
    }

    async clear() {
        try {
            console.log('🧹 Clearing products...');
            await this.productModel.deleteMany({});
            console.log('✅ Products cleared successfully!');
        } catch (error) {
            console.error('❌ Error clearing products:', error);
            throw error;
        }
    }
}
