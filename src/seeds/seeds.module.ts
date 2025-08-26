import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersSeedService } from './users.seed';
import { CategoriesSeedService } from './categories.seed';
import { ProductsSeedService } from './products.seed';
import { SettingsSeedService } from './settings.seed';
import { MainSeedService } from './main.seed';
import { SeedsController } from './seeds.controller';
import { User, UserSchema } from '../users/scheme/user.scheme';
import { Branch, BranchSchema } from '../branches/scheme/branche.scheme';
import { Category, CategorySchema } from '../categories/scheme/category.scheme';
import { Product, ProductSchema } from '../products/scheme/product.schem';
import { Settings, SettingsSchema } from '../settings/scheme/settings.scheme';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: Branch.name, schema: BranchSchema },
            { name: Category.name, schema: CategorySchema },
            { name: Product.name, schema: ProductSchema },
            { name: Settings.name, schema: SettingsSchema },
        ]),
    ],
    controllers: [SeedsController],
    providers: [
        UsersSeedService,
        CategoriesSeedService,
        ProductsSeedService,
        SettingsSeedService,
        MainSeedService,
    ],
    exports: [
        UsersSeedService,
        CategoriesSeedService,
        ProductsSeedService,
        SettingsSeedService,
        MainSeedService,
    ],
})
export class SeedsModule { }
