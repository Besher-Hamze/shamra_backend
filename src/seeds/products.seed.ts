import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../products/scheme/product.schem';
import { Category, CategoryDocument } from '../categories/scheme/category.scheme';
import { SubCategory, SubCategoryDocument } from '../sub-categories/scheme/sub-category.scheme';
import { Branch, BranchDocument } from '../branches/scheme/branche.scheme';
import { ProductStatus } from 'src/common/enums';

@Injectable()
export class ProductsSeedService {
    constructor(
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
        @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
        @InjectModel(SubCategory.name) private subCategoryModel: Model<SubCategoryDocument>,
        @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
    ) { }

    private readonly TOTAL_PRODUCTS = 100000;
    private readonly BATCH_SIZE = 1000;

    // Comprehensive product data for realistic generation
    private readonly productTemplates = {
        electronics: {
            smartphones: [
                'iPhone', 'Samsung Galaxy', 'Google Pixel', 'OnePlus', 'Huawei P', 'Xiaomi Mi',
                'Sony Xperia', 'LG G', 'Motorola Edge', 'Oppo Find', 'Vivo X', 'Realme GT'
            ],
            laptops: [
                'MacBook Pro', 'MacBook Air', 'Dell XPS', 'HP Pavilion', 'Lenovo ThinkPad',
                'ASUS ROG', 'Acer Aspire', 'MSI Gaming', 'Surface Laptop', 'Alienware'
            ],
            tablets: [
                'iPad Pro', 'iPad Air', 'Samsung Galaxy Tab', 'Microsoft Surface',
                'Lenovo Tab', 'Huawei MatePad', 'Amazon Fire', 'Google Pixel Slate'
            ],
            accessories: [
                'Wireless Earbuds', 'Bluetooth Speaker', 'Phone Case', 'Screen Protector',
                'Power Bank', 'Wireless Charger', 'USB Cable', 'Headphones', 'Smartwatch'
            ]
        },
        fashion: {
            clothing: [
                'T-Shirt', 'Jeans', 'Dress', 'Hoodie', 'Jacket', 'Sweater', 'Shorts',
                'Blouse', 'Skirt', 'Pants', 'Cardigan', 'Blazer', 'Coat', 'Vest'
            ],
            footwear: [
                'Nike Air Max', 'Adidas Ultraboost', 'Converse Chuck Taylor', 'Vans Old Skool',
                'Puma Suede', 'New Balance', 'Jordan', 'Timberland', 'Doc Martens'
            ],
            accessories: [
                'Sunglasses', 'Watch', 'Belt', 'Wallet', 'Handbag', 'Backpack',
                'Scarf', 'Hat', 'Jewelry', 'Ring', 'Necklace', 'Bracelet'
            ]
        },
        home: {
            furniture: [
                'Sofa', 'Dining Table', 'Bed Frame', 'Wardrobe', 'Desk', 'Chair',
                'Bookshelf', 'Coffee Table', 'TV Stand', 'Nightstand', 'Dresser'
            ],
            appliances: [
                'Refrigerator', 'Washing Machine', 'Microwave', 'Air Conditioner',
                'Vacuum Cleaner', 'Dishwasher', 'Oven', 'Blender', 'Coffee Maker'
            ],
            decor: [
                'Wall Art', 'Lamp', 'Vase', 'Mirror', 'Cushion', 'Curtains',
                'Carpet', 'Plant Pot', 'Candle', 'Picture Frame'
            ]
        },
        sports: {
            equipment: [
                'Basketball', 'Soccer Ball', 'Tennis Racket', 'Golf Club', 'Dumbbell',
                'Yoga Mat', 'Treadmill', 'Bicycle', 'Skateboard', 'Swimming Goggles'
            ],
            apparel: [
                'Running Shoes', 'Gym Shorts', 'Sports Bra', 'Athletic T-Shirt',
                'Track Pants', 'Compression Wear', 'Sports Socks', 'Training Gloves'
            ]
        },
        books: {
            fiction: [
                'Mystery Novel', 'Romance Novel', 'Science Fiction', 'Fantasy Book',
                'Thriller', 'Historical Fiction', 'Literary Fiction', 'Adventure Story'
            ],
            nonfiction: [
                'Self-Help Book', 'Biography', 'Business Book', 'Health Guide',
                'Cookbook', 'Travel Guide', 'History Book', 'Science Book'
            ]
        }
    };

    private readonly brands = [
        'Apple', 'Samsung', 'Google', 'Nike', 'Adidas', 'Sony', 'LG', 'Dell', 'HP',
        'Lenovo', 'ASUS', 'Acer', 'Microsoft', 'Amazon', 'Zara', 'H&M', 'IKEA',
        'Uniqlo', 'Canon', 'Nikon', 'Panasonic', 'Philips', 'Bosch', 'Siemens'
    ];

    private readonly colors = [
        'Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Purple',
        'Orange', 'Brown', 'Gray', 'Silver', 'Gold', 'Rose Gold', 'Space Gray'
    ];

    private readonly sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '32', '34', '36', '38', '40', '42'];

    private readonly adjectives = [
        'Premium', 'Professional', 'Ultra', 'Pro', 'Max', 'Plus', 'Lite', 'Mini',
        'Advanced', 'Smart', 'Wireless', 'Portable', 'Compact', 'Deluxe', 'Essential'
    ];

    private readonly keywords = [
        'durable', 'lightweight', 'waterproof', 'wireless', 'bluetooth', 'smart',
        'portable', 'rechargeable', 'eco-friendly', 'premium', 'professional',
        'ergonomic', 'versatile', 'innovative', 'high-quality', 'affordable'
    ];

    async seed() {
        try {
            console.log('🌱 Starting products seeding...');
            console.log(`📦 Target: ${this.TOTAL_PRODUCTS.toLocaleString()} products`);

            // Check if products already exist
            const existingProducts = await this.productModel.countDocuments();
            if (existingProducts > 0) {
                console.log('⚠️  Products already exist, skipping seeding...');
                console.log(`📊 Current count: ${existingProducts.toLocaleString()} products`);
                return;
            }

            // Get required data
            const categories = await this.categoryModel.find({ isActive: true, isDeleted: false });
            const subCategories = await this.subCategoryModel.find({ isActive: true, isDeleted: false });
            const branches = await this.branchModel.find({ isActive: true, isDeleted: false });

            if (categories.length === 0 || subCategories.length === 0 || branches.length === 0) {
                console.log('⚠️  Missing required data. Please seed categories, sub-categories, and branches first.');
                return;
            }

            console.log(`📋 Found ${categories.length} categories, ${subCategories.length} sub-categories, ${branches.length} branches`);

            let totalCreated = 0;
            const batches = Math.ceil(this.TOTAL_PRODUCTS / this.BATCH_SIZE);

            for (let batch = 0; batch < batches; batch++) {
                const batchStart = batch * this.BATCH_SIZE;
                const batchEnd = Math.min(batchStart + this.BATCH_SIZE, this.TOTAL_PRODUCTS);
                const batchSize = batchEnd - batchStart;

                console.log(`🔄 Processing batch ${batch + 1}/${batches} (${batchSize} products)...`);

                const products = [];
                for (let i = 0; i < batchSize; i++) {
                    const product = this.generateRandomProduct(categories, subCategories, branches, batchStart + i);
                    products.push(product);
                }

                // Insert batch with error handling
                try {
                    await this.productModel.insertMany(products, { ordered: false });
                    totalCreated += batchSize;
                    console.log(`✅ Batch ${batch + 1} completed. Total: ${totalCreated.toLocaleString()}/${this.TOTAL_PRODUCTS.toLocaleString()}`);
                } catch (error) {
                    // Handle potential duplicate errors
                    if (error.code === 11000) {
                        console.log(`⚠️  Some duplicates in batch ${batch + 1}, continuing...`);
                        totalCreated += batchSize; // Approximate count
                    } else {
                        throw error;
                    }
                }

                // Add small delay to prevent overwhelming the database
                if (batch % 10 === 0 && batch > 0) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            // Final count verification
            const finalCount = await this.productModel.countDocuments();
            console.log('🎉 Products seeding completed!');
            console.log(`📊 Final count: ${finalCount.toLocaleString()} products created`);

            return { created: totalCreated, verified: finalCount };
        } catch (error) {
            console.error('❌ Error seeding products:', error);
            throw error;
        }
    }

    private generateRandomProduct(
        categories: CategoryDocument[],
        subCategories: SubCategoryDocument[],
        branches: BranchDocument[],
        index: number
    ) {
        // Select random category and subcategory
        const category = this.getRandomElement(categories);
        const categorySubCategories = subCategories.filter(
            sc => sc.categoryId.toString() === category._id.toString()
        );
        const subCategory = categorySubCategories.length > 0
            ? this.getRandomElement(categorySubCategories)
            : this.getRandomElement(subCategories);

        // Generate product name and details
        const productType = this.generateProductType();
        const brand = this.getRandomElement(this.brands);
        const adjective = Math.random() > 0.3 ? this.getRandomElement(this.adjectives) : '';
        const model = this.generateModelNumber();
        const color = Math.random() > 0.4 ? this.getRandomElement(this.colors) : '';

        const nameParts = [adjective, brand, productType, model, color].filter(Boolean);
        const name = nameParts.join(' ');

        // Generate specifications
        const specifications = this.generateSpecifications(productType);

        // Generate pricing
        const basePrice = this.generatePrice();
        const costPrice = Math.round(basePrice * (0.6 + Math.random() * 0.3)); // 60-90% of selling price
        const wholeSalePrice = Math.round(basePrice * (0.7 + Math.random() * 0.2)); // 70-90% of selling price

        // Generate branch pricing
        const branchPricing = this.generateBranchPricing(branches, basePrice, costPrice, wholeSalePrice, index);

        // Select random branches for availability
        const availableBranches = this.selectRandomBranches(branches);

        return {
            name,
            description: this.generateDescription(productType, brand, specifications),
            specifications,
            barcode: this.generateBarcode(index),
            branchPricing,
            categoryId: category._id.toString(),
            subCategoryId: subCategory._id.toString(),
            images: this.generateImageUrls(productType),
            mainImage: "uploads/products/f78d0135-c4a2-49df-8239-f2ccb7495aa9.png",
            brand,
            branches: availableBranches.map(b => b._id),
            status: this.getRandomElement(Object.values(ProductStatus)),
            isActive: Math.random() > 0.1, // 90% active
            isFeatured: Math.random() > 0.8, // 20% featured
            tags: this.generateTags(productType, brand),
            keywords: this.generateKeywords(),
            totalSales: Math.floor(Math.random() * 1000),
            viewCount: Math.floor(Math.random() * 5000),
            rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0 - 5.0 rating
            reviewCount: Math.floor(Math.random() * 200),
            sortOrder: Math.floor(Math.random() * 1000),
            isDeleted: false,
        };
    }

    private generateProductType(): string {
        const categories = Object.keys(this.productTemplates);
        const category = this.getRandomElement(categories);
        const subcategories = Object.keys(this.productTemplates[category]);
        const subcategory = this.getRandomElement(subcategories);
        return this.getRandomElement(this.productTemplates[category][subcategory]);
    }

    private generateModelNumber(): string {
        const patterns = [
            () => Math.random().toString(36).substring(2, 8).toUpperCase(),
            () => `${Math.floor(Math.random() * 9000) + 1000}`,
            () => `${this.getRandomElement(['Pro', 'Max', 'Plus', 'Ultra'])}-${Math.floor(Math.random() * 100)}`,
            () => `Gen${Math.floor(Math.random() * 5) + 1}`,
            () => `V${Math.floor(Math.random() * 10) + 1}`,
        ];

        return this.getRandomElement(patterns)();
    }

    private generateSpecifications(productType: string): Map<string, any> {
        const specs = new Map();

        // Common specifications
        if (Math.random() > 0.3) {
            specs.set('color', this.getRandomElement(this.colors));
        }

        if (Math.random() > 0.4) {
            specs.set('weight', `${(Math.random() * 5 + 0.1).toFixed(1)}kg`);
        }

        // Product-specific specifications
        if (productType.toLowerCase().includes('phone') || productType.toLowerCase().includes('smartphone')) {
            specs.set('screen_size', `${(Math.random() * 2 + 5).toFixed(1)}"`);
            specs.set('storage', this.getRandomElement(['64GB', '128GB', '256GB', '512GB', '1TB']));
            specs.set('ram', this.getRandomElement(['4GB', '6GB', '8GB', '12GB', '16GB']));
            specs.set('battery', `${Math.floor(Math.random() * 2000 + 3000)}mAh`);
        }

        if (productType.toLowerCase().includes('laptop')) {
            specs.set('screen_size', `${Math.floor(Math.random() * 5) + 13}"`);
            specs.set('processor', this.getRandomElement(['Intel Core i5', 'Intel Core i7', 'AMD Ryzen 5', 'AMD Ryzen 7', 'Apple M1', 'Apple M2']));
            specs.set('ram', this.getRandomElement(['8GB', '16GB', '32GB']));
            specs.set('storage', this.getRandomElement(['256GB SSD', '512GB SSD', '1TB SSD', '2TB SSD']));
        }

        if (productType.toLowerCase().includes('clothing') || productType.toLowerCase().includes('shirt') || productType.toLowerCase().includes('dress')) {
            specs.set('size', this.getRandomElement(this.sizes));
            specs.set('material', this.getRandomElement(['Cotton', '100% Cotton', 'Polyester', 'Cotton Blend', 'Denim', 'Wool', 'Silk', 'Linen']));
        }

        return specs;
    }

    private generatePrice(): number {
        // Different price ranges based on product type
        const ranges = [
            { min: 10, max: 100, weight: 0.4 },      // Accessories, small items
            { min: 100, max: 500, weight: 0.3 },     // Mid-range items
            { min: 500, max: 2000, weight: 0.2 },    // Electronics, furniture
            { min: 2000, max: 10000, weight: 0.1 }   // Premium items
        ];

        const selectedRange = this.weightedRandom(ranges);
        return Math.round((Math.random() * (selectedRange.max - selectedRange.min) + selectedRange.min) / 10) * 10;
    }

    private generateBranchPricing(
        branches: BranchDocument[],
        basePrice: number,
        baseCostPrice: number,
        baseWholeSalePrice: number,
        productIndex: number
    ) {
        const branchPricing = [];

        // Randomly select 1-4 branches for this product
        const selectedBranches = this.selectRandomBranches(branches, Math.floor(Math.random() * 4) + 1);

        selectedBranches.forEach((branch, index) => {
            // Slight price variations per branch (±5%)
            const priceVariation = 0.95 + Math.random() * 0.1;
            const price = Math.round(basePrice * priceVariation);
            const costPrice = Math.round(baseCostPrice * priceVariation);
            const wholeSalePrice = Math.round(baseWholeSalePrice * priceVariation);

            const isOnSale = Math.random() > 0.8; // 20% chance of being on sale
            const salePrice = isOnSale ? Math.round(price * (0.7 + Math.random() * 0.2)) : undefined;

            branchPricing.push({
                branchId: branch._id,
                price,
                costPrice,
                wholeSalePrice,
                salePrice,
                currency: 'SYP',
                stockQuantity: Math.floor(Math.random() * 100),
                sku: `SKU-${productIndex}-${branch._id.toString().slice(-4)}`,
                isOnSale,
                isActive: Math.random() > 0.05, // 95% active
            });
        });

        return branchPricing;
    }

    private selectRandomBranches(branches: BranchDocument[], count?: number): BranchDocument[] {
        const selectedCount = count || Math.floor(Math.random() * branches.length) + 1;
        const shuffled = [...branches].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(selectedCount, branches.length));
    }

    private generateImageUrls(productType: string): string[] {
        const imageCount = Math.floor(Math.random() * 5) + 1; // 1-5 images
        const images = [];

        for (let i = 0; i < imageCount; i++) {
            images.push("uploads/products/f78d0135-c4a2-49df-8239-f2ccb7495aa9.png");
        }

        return images;
    }

    private generateDescription(productType: string, brand: string, specifications: Map<string, any>): string {
        const templates = [
            `Experience the premium quality of ${brand} ${productType}. Built with attention to detail and designed for modern lifestyle.`,
            `Discover the perfect blend of style and functionality with this ${brand} ${productType}. Ideal for everyday use.`,
            `Elevate your experience with the ${brand} ${productType}. Features innovative design and reliable performance.`,
            `The ${brand} ${productType} offers exceptional value with premium features and lasting durability.`,
            `Enhance your lifestyle with the ${brand} ${productType}. Perfectly crafted for the discerning user.`
        ];

        let description = this.getRandomElement(templates);

        // Add specifications to description
        const specEntries = Array.from(specifications.entries()).slice(0, 3);
        if (specEntries.length > 0) {
            const specText = specEntries.map(([key, value]) => `${key.replace('_', ' ')}: ${value}`).join(', ');
            description += ` Key features: ${specText}.`;
        }

        return description;
    }

    private generateTags(productType: string, brand: string): string[] {
        const baseTags = [productType.toLowerCase(), brand.toLowerCase()];
        const additionalTags = this.getRandomElements(this.keywords, Math.floor(Math.random() * 3) + 2);
        return [...baseTags, ...additionalTags];
    }

    private generateKeywords(): string[] {
        return this.getRandomElements(this.keywords, Math.floor(Math.random() * 5) + 3);
    }

    private generateBarcode(index: number): string {
        // Generate a realistic-looking barcode
        const prefix = '123456'; // Company prefix
        const productCode = index.toString().padStart(6, '0');
        const checkDigit = this.calculateBarcodeCheckDigit(prefix + productCode);
        return prefix + productCode + checkDigit;
    }

    private calculateBarcodeCheckDigit(barcode: string): string {
        let sum = 0;
        for (let i = 0; i < barcode.length; i++) {
            const digit = parseInt(barcode[i]);
            sum += i % 2 === 0 ? digit : digit * 3;
        }
        return ((10 - (sum % 10)) % 10).toString();
    }

    // Utility methods
    private getRandomElement<T>(array: T[]): T {
        return array[Math.floor(Math.random() * array.length)];
    }

    private getRandomElements<T>(array: T[], count: number): T[] {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(count, array.length));
    }

    private weightedRandom<T extends { weight: number }>(items: T[]): T {
        const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;

        for (const item of items) {
            random -= item.weight;
            if (random <= 0) return item;
        }

        return items[items.length - 1];
    }

    async clear() {
        try {
            console.log('🧹 Clearing products...');
            const deleteResult = await this.productModel.deleteMany({});
            console.log(`✅ Products cleared successfully! Deleted: ${deleteResult.deletedCount?.toLocaleString() || 0}`);
        } catch (error) {
            console.error('❌ Error clearing products:', error);
            throw error;
        }
    }

    async getStats() {
        try {
            const stats = await this.productModel.aggregate([
                {
                    $group: {
                        _id: null,
                        totalProducts: { $sum: 1 },
                        activeProducts: { $sum: { $cond: ['$isActive', 1, 0] } },
                        featuredProducts: { $sum: { $cond: ['$isFeatured', 1, 0] } },
                        averagePrice: { $avg: '$price' },
                        totalSales: { $sum: '$totalSales' }
                    }
                }
            ]);

            if (stats.length > 0) {
                const stat = stats[0];
                console.log('📊 Product Statistics:');
                console.log(`   Total Products: ${stat.totalProducts?.toLocaleString() || 0}`);
                console.log(`   Active Products: ${stat.activeProducts?.toLocaleString() || 0}`);
                console.log(`   Featured Products: ${stat.featuredProducts?.toLocaleString() || 0}`);
                console.log(`   Average Price: $${stat.averagePrice?.toFixed(2) || 0}`);
                console.log(`   Total Sales: ${stat.totalSales?.toLocaleString() || 0}`);
            }

            return stats[0] || {};
        } catch (error) {
            console.error('❌ Error getting stats:', error);
            throw error;
        }
    }
}