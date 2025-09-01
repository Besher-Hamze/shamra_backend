import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubCategoriesService } from './sub-categories.service';
import { SubCategoriesController } from './sub-categories.controller';
import { SubCategory, SubCategorySchema } from './scheme/sub-category.scheme';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: SubCategory.name, schema: SubCategorySchema },
        ]),
    ],
    controllers: [SubCategoriesController],
    providers: [SubCategoriesService],
    exports: [SubCategoriesService],
})
export class SubCategoriesModule { }
