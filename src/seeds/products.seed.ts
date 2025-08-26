import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../products/scheme/product.schem';
import { Category, CategoryDocument } from '../categories/scheme/category.scheme';

@Injectable()
export class ProductsSeedService {
    constructor(
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
        @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
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

            const products = [
                // Smartphones
                {
                    name: 'iPhone 15 Pro',
                    nameAr: 'آيفون 15 برو',
                    description: 'Latest iPhone with advanced features and titanium design',
                    descriptionAr: 'أحدث آيفون بميزات متقدمة وتصميم تيتانيوم',
                    price: 8500000,
                    costPrice: 7000000,
                    categoryId: categories.find(c => c.name === 'Smartphones')?._id,
                    brand: 'Apple',
                    model: 'iPhone 15 Pro',
                    stockQuantity: 25,
                    minStockLevel: 5,
                    sku: 'IPH15PRO-001',
                    isFeatured: true,
                    isActive: true,
                    images: ['iphone15pro-1.jpg', 'iphone15pro-2.jpg'],
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
                    nameAr: 'سامسونج جالكسي إس 24 الترا',
                    description: 'Premium Android smartphone with S Pen and AI features',
                    descriptionAr: 'هاتف أندرويد فاخر مع قلم إس وميزات الذكاء الاصطناعي',
                    price: 7500000,
                    costPrice: 6000000,
                    categoryId: categories.find(c => c.name === 'Smartphones')?._id,
                    brand: 'Samsung',
                    model: 'Galaxy S24 Ultra',
                    stockQuantity: 30,
                    minStockLevel: 5,
                    sku: 'SAMS24ULT-001',
                    isFeatured: true,
                    isActive: true,
                    images: ['galaxys24ultra-1.jpg', 'galaxys24ultra-2.jpg'],
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
                    nameAr: 'ماك بوك برو 16 بوصة إم 3 برو',
                    description: 'Professional laptop with M3 Pro chip for creative work',
                    descriptionAr: 'لابتوب احترافي بمعالج إم 3 برو للعمل الإبداعي',
                    price: 15000000,
                    costPrice: 12000000,
                    categoryId: categories.find(c => c.name === 'Computers & Laptops')?._id,
                    brand: 'Apple',
                    model: 'MacBook Pro 16" M3 Pro',
                    stockQuantity: 15,
                    minStockLevel: 3,
                    sku: 'MBP16M3P-001',
                    isFeatured: true,
                    isActive: true,
                    images: ['macbookpro16-1.jpg', 'macbookpro16-2.jpg'],
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
                    nameAr: 'ديل إكس بي إس 15',
                    description: 'Premium Windows laptop with OLED display and RTX graphics',
                    descriptionAr: 'لابتوب ويندوز فاخر بشاشة أوليد ورسومات آر تي إكس',
                    price: 12000000,
                    costPrice: 9500000,
                    categoryId: categories.find(c => c.name === 'Computers & Laptops')?._id,
                    brand: 'Dell',
                    model: 'XPS 15',
                    stockQuantity: 20,
                    minStockLevel: 3,
                    sku: 'DELLXPS15-001',
                    isFeatured: false,
                    isActive: true,
                    images: ['dellxps15-1.jpg', 'dellxps15-2.jpg'],
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
                    nameAr: 'سوني دبليو إتش 1000 إكس إم 5',
                    description: 'Premium noise-cancelling wireless headphones',
                    descriptionAr: 'سماعات لاسلكية فاخرة مع إلغاء الضوضاء',
                    price: 2800000,
                    costPrice: 2200000,
                    categoryId: categories.find(c => c.name === 'Audio & Speakers')?._id,
                    brand: 'Sony',
                    model: 'WH-1000XM5',
                    stockQuantity: 40,
                    minStockLevel: 8,
                    sku: 'SONYWHXM5-001',
                    isFeatured: true,
                    isActive: true,
                    images: ['sonywh1000xm5-1.jpg', 'sonywh1000xm5-2.jpg'],
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
                    nameAr: 'بلاي ستيشن 5',
                    description: 'Next-generation gaming console with 4K graphics',
                    descriptionAr: 'منصة ألعاب الجيل القادم برسومات 4K',
                    price: 4500000,
                    costPrice: 3500000,
                    categoryId: categories.find(c => c.name === 'Gaming')?._id,
                    brand: 'Sony',
                    model: 'PlayStation 5',
                    stockQuantity: 35,
                    minStockLevel: 5,
                    sku: 'PS5-001',
                    isFeatured: true,
                    isActive: true,
                    images: ['ps5-1.jpg', 'ps5-2.jpg'],
                    specifications: {
                        storage: '825GB SSD',
                        resolution: '4K',
                        fps: 'Up to 120fps',
                        controller: 'DualSense',
                    },
                    tags: ['gaming', 'console', 'sony', '4k'],
                    slug: 'playstation-5',
                },
                // Cameras
                {
                    name: 'Canon EOS R6 Mark II',
                    nameAr: 'كانون إي أو إس آر 6 مارك 2',
                    description: 'Full-frame mirrorless camera for professional photography',
                    descriptionAr: 'كاميرا مرآة عديمة عدسة إطار كامل للتصوير الاحترافي',
                    price: 8500000,
                    costPrice: 6800000,
                    categoryId: categories.find(c => c.name === 'Cameras & Photography')?._id,
                    brand: 'Canon',
                    model: 'EOS R6 Mark II',
                    stockQuantity: 18,
                    minStockLevel: 3,
                    sku: 'CANONR6M2-001',
                    isFeatured: false,
                    isActive: true,
                    images: ['canonr6m2-1.jpg', 'canonr6m2-2.jpg'],
                    specifications: {
                        sensor: '24.2MP Full-frame',
                        video: '4K 60fps',
                        autofocus: 'Dual Pixel CMOS AF II',
                        stabilization: '5-axis IBIS',
                    },
                    tags: ['camera', 'canon', 'mirrorless', 'professional'],
                    slug: 'canon-eos-r6-mark-ii',
                },
                // Home Appliances
                {
                    name: 'LG OLED TV 65" C3',
                    nameAr: 'إل جي أوليد تي في 65 بوصة سي 3',
                    description: 'Premium OLED TV with AI processing and gaming features',
                    descriptionAr: 'تلفاز أوليد فاخر بمعالجة ذكية وميزات الألعاب',
                    price: 12000000,
                    costPrice: 9500000,
                    categoryId: categories.find(c => c.name === 'Home Appliances')?._id,
                    brand: 'LG',
                    model: 'OLED65C3',
                    stockQuantity: 12,
                    minStockLevel: 2,
                    sku: 'LGOLED65C3-001',
                    isFeatured: true,
                    isActive: true,
                    images: ['lgoled65c3-1.jpg', 'lgoled65c3-2.jpg'],
                    specifications: {
                        screen: '65 inch OLED',
                        resolution: '4K Ultra HD',
                        hdr: 'Dolby Vision HDR',
                        gaming: '120Hz, VRR, ALLM',
                    },
                    tags: ['tv', 'lg', 'oled', '4k', 'gaming'],
                    slug: 'lg-oled-tv-65-c3',
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
