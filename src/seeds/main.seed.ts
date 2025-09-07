import { Injectable, OnModuleInit } from '@nestjs/common';
import { UsersSeedService } from './users.seed';
import { CategoriesSeedService } from './categories.seed';
import { ProductsSeedService } from './products.seed';
import { SettingsSeedService } from './settings.seed';
import { SubCategoriesSeedService } from './sub-categories.seed';

@Injectable()
export class MainSeedService implements OnModuleInit {
    constructor(
        private readonly usersSeedService: UsersSeedService,
        private readonly categoriesSeedService: CategoriesSeedService,
        private readonly productsSeedService: ProductsSeedService,
        private readonly settingsSeedService: SettingsSeedService,
        private readonly subCategoriesSeedService: SubCategoriesSeedService
    ) { }

    async onModuleInit() {
        await this.seedAll();
    }

    async seedAll() {
        try {
            console.log('🚀 Starting Shamra Backend seeding process...');
            console.log('==========================================');

            // Seed in order of dependencies
            const results = {
                settings: null,
                users: null,
                categories: null,
                subCategories: null,
                products: null,
            };

            // 1. Seed Settings first (no dependencies)
            console.log('\n📋 Step 1: Seeding System Settings');
            results.settings = await this.settingsSeedService.seed();

            // 2. Seed Users (creates default branch)
            console.log('\n👥 Step 2: Seeding Users and Default Branch');
            results.users = await this.usersSeedService.seed();

            // 3. Seed Categories
            console.log('\n🏷️  Step 3: Seeding Product Categories');
            // results.categories = await this.categoriesSeedService.seed();

            // // 4. Seed Sub-Categories (depends on categories)
            console.log('\n🔗 Step 4: Seeding Sub-Categories');
            // results.subCategories = await this.subCategoriesSeedService.seed();

            // 5. Seed Products (depends on categories and sub-categories)
            console.log('\n📱 Step 5: Seeding Products');
            // results.products = await this.productsSeedService.seed();

            console.log('\n==========================================');
            console.log('🎉 Seeding completed successfully!');
            console.log('==========================================');
            console.log('📊 Summary:');
            console.log(`   ⚙️  Settings: ${results.settings ? 'Created' : 'Skipped'}`);
            console.log(`   👥 Users: ${results.users ? 'Created' : 'Skipped'}`);
            console.log(`   🏷️  Categories: ${results.categories ? 'Created' : 'Skipped'}`);
            console.log(`   🔗 Sub-Categories: ${results.subCategories ? 'Created' : 'Skipped'}`);
            console.log(`   📱 Products: ${results.products ? 'Created' : 'Skipped'}`);

            if (results.users) {
                console.log('\n🔑 Login Credentials:');
                console.log('   👑 Admin: admin@shamra.com / admin123');
                console.log('   👨‍💼 Manager: manager@shamra.com / manager123');
                console.log('   👷 Employee: employee@shamra.com / employee123');
            }

            console.log('\n✨ Your Shamra Backend is ready to use!');
            return results;
        } catch (error) {
            console.error('❌ Error during seeding process:', error);
            throw error;
        }
    }

    async clearAll() {
        try {
            console.log('🧹 Starting Shamra Backend clearing process...');
            console.log('==========================================');

            // Clear in reverse order of dependencies
            console.log('\n📱 Step 1: Clearing Products');
            await this.productsSeedService.clear();

            console.log('\n🔗 Step 2: Clearing Sub-Categories');
            await this.subCategoriesSeedService.clear();

            console.log('\n🏷️  Step 3: Clearing Categories');
            await this.categoriesSeedService.clear();

            console.log('\n👥 Step 4: Clearing Users');
            await this.usersSeedService.clear();

            console.log('\n⚙️  Step 5: Clearing Settings');
            await this.settingsSeedService.clear();

            console.log('\n==========================================');
            console.log('✅ All data cleared successfully!');
            console.log('==========================================');
        } catch (error) {
            console.error('❌ Error during clearing process:', error);
            throw error;
        }
    }

    async reset() {
        try {
            console.log('🔄 Starting Shamra Backend reset process...');
            console.log('==========================================');

            // Clear all data first
            await this.clearAll();

            // Then seed all data
            await this.seedAll();

            console.log('\n==========================================');
            console.log('🔄 Reset completed successfully!');
            console.log('==========================================');
        } catch (error) {
            console.error('❌ Error during reset process:', error);
            throw error;
        }
    }
}
