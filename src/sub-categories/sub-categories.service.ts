import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SubCategory, SubCategoryDocument } from './scheme/sub-category.scheme';
import { CreateSubCategoryDto } from './dto/create-sub-category.dto';
import { UpdateSubCategoryDto } from './dto/update-sub-category.dto';
import { SubCategoryQueryDto } from './dto/sub-category-query.dto';
import { parseJsonField } from 'src/common/helpers';

@Injectable()
export class SubCategoriesService {
    constructor(
        @InjectModel(SubCategory.name) private subCategoryModel: Model<SubCategoryDocument>,
    ) { }

    async create(createSubCategoryDto: CreateSubCategoryDto): Promise<SubCategory> {
        createSubCategoryDto.customFields = parseJsonField(createSubCategoryDto.customFields, []);
        const subCategory = new this.subCategoryModel(createSubCategoryDto);
        return await subCategory.save();
    }

    async findAll(query: SubCategoryQueryDto = {}): Promise<SubCategory[]> {
        const filter: any = { isDeleted: false };

        if (query.name) {
            filter.name = { $regex: query.name, $options: 'i' };
        }

        if (query.categoryId) {
            filter.categoryId = query.categoryId;
        }

        if (query.type) {
            filter.type = query.type;
        }

        if (query.isActive !== undefined) {
            filter.isActive = query.isActive;
        }

        if (query.search) {
            filter.$or = [
                { name: { $regex: query.search, $options: 'i' } },
            ];
        }

        return await this.subCategoryModel
            .find(filter)
            .exec();
    }

    async findOne(id: string): Promise<SubCategory> {
        const subCategory = await this.subCategoryModel
            .findOne({ _id: id, isDeleted: false })
            .exec();

        if (!subCategory) {
            throw new NotFoundException(`SubCategory with ID ${id} not found`);
        }

        return subCategory;
    }

    async findByCategory(categoryId: string): Promise<SubCategory[]> {
        return await this.subCategoryModel
            .find({ categoryId, isActive: true, isDeleted: false })
            .exec();
    }

    async update(id: string, updateSubCategoryDto: UpdateSubCategoryDto): Promise<SubCategory> {
        const subCategory = await this.subCategoryModel
            .findOneAndUpdate(
                { _id: id, isDeleted: false },
                updateSubCategoryDto,
                { new: true }
            )
            .exec();

        if (!subCategory) {
            throw new NotFoundException(`SubCategory with ID ${id} not found`);
        }

        return subCategory;
    }

    async remove(id: string): Promise<void> {
        const result = await this.subCategoryModel
            .findOneAndUpdate(
                { _id: id, isDeleted: false },
                { isDeleted: true },
                { new: true }
            )
            .exec();

        if (!result) {
            throw new NotFoundException(`SubCategory with ID ${id} not found`);
        }
    }
}
