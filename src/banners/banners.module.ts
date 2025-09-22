import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BannersController } from './banners.controller';
import { BannersService } from './banners.service';
import { Banner, BannerSchema } from './scheme/banner.scheme';
import { Product, ProductSchema } from 'src/products/scheme/product.schem';
import { Category, CategorySchema } from 'src/categories/scheme/category.scheme';
import { SubCategory, SubCategorySchema } from 'src/sub-categories/scheme/sub-category.scheme';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Banner.name, schema: BannerSchema },
            { name: Product.name, schema: ProductSchema },
            { name: Category.name, schema: CategorySchema },
            { name: SubCategory.name, schema: SubCategorySchema },
        ]),
    ],
    controllers: [BannersController],
    providers: [BannersService],
    exports: [BannersService],
})
export class BannersModule { }
