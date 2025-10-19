import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product, ProductSchema } from './scheme/product.schem';
import { Category, CategorySchema } from 'src/categories/scheme/category.scheme';
import { SubCategory, SubCategorySchema } from 'src/sub-categories/scheme/sub-category.scheme';
import { Branch, BranchSchema } from 'src/branches/scheme/branche.scheme';
import { FilesService } from 'src/files/files.service';
import { User, UserSchema } from 'src/users/scheme/user.scheme';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Category.name, schema: CategorySchema },
      { name: SubCategory.name, schema: SubCategorySchema },
      { name: Branch.name, schema: BranchSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService, FilesService],
  exports: [ProductsService],
})
export class ProductsModule { }