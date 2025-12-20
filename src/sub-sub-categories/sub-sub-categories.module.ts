import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubSubCategoriesService } from './sub-sub-categories.service';
import { SubSubCategoriesController } from './sub-sub-categories.controller';
import { SubSubCategory, SubSubCategorySchema } from './scheme/sub-sub-category.scheme';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: SubSubCategory.name, schema: SubSubCategorySchema },
        ]),
    ],
    controllers: [SubSubCategoriesController],
    providers: [SubSubCategoriesService],
    exports: [SubSubCategoriesService],
})
export class SubSubCategoriesModule { }

