import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SubSubCategory, SubSubCategoryDocument } from './scheme/sub-sub-category.scheme';
import { CreateSubSubCategoryDto } from './dto/create-sub-sub-category.dto';
import { UpdateSubSubCategoryDto } from './dto/update-sub-sub-category.dto';
import { SubSubCategoryQueryDto } from './dto/sub-sub-category-query.dto';

@Injectable()
export class SubSubCategoriesService {
    constructor(
        @InjectModel(SubSubCategory.name) private subSubCategoryModel: Model<SubSubCategoryDocument>,
    ) { }

    async create(createSubSubCategoryDto: CreateSubSubCategoryDto): Promise<SubSubCategory> {
        const subSubCategory = new this.subSubCategoryModel(createSubSubCategoryDto);
        return await subSubCategory.save();
    }

    async findAll(query: SubSubCategoryQueryDto = {}): Promise<SubSubCategory[]> {
        const filter: any = { isDeleted: false };

        if (query.name) {
            filter.name = { $regex: query.name, $options: 'i' };
        }

        if (query.subCategoryId) {
            filter.subCategoryId = query.subCategoryId;
        }

        if (query.isActive !== undefined) {
            filter.isActive = query.isActive;
        }

        if (query.search) {
            filter.$or = [
                { name: { $regex: query.search, $options: 'i' } },
            ];
        }

        return await this.subSubCategoryModel
            .find(filter)
            .exec();
    }

    async findOne(id: string): Promise<SubSubCategory> {
        const subSubCategory = await this.subSubCategoryModel
            .findOne({ _id: id, isDeleted: false })
            .exec();

        if (!subSubCategory) {
            throw new NotFoundException(`SubSubCategory with ID ${id} not found`);
        }

        return subSubCategory;
    }

    async findBySubCategory(subCategoryId: string): Promise<SubSubCategory[]> {
        return await this.subSubCategoryModel
            .find({ subCategoryId, isActive: true, isDeleted: false })
            .exec();
    }

    async update(id: string, updateSubSubCategoryDto: UpdateSubSubCategoryDto): Promise<SubSubCategory> {
        const subSubCategory = await this.subSubCategoryModel
            .findOneAndUpdate(
                { _id: id, isDeleted: false },
                updateSubSubCategoryDto,
                { new: true }
            )
            .exec();

        if (!subSubCategory) {
            throw new NotFoundException(`SubSubCategory with ID ${id} not found`);
        }

        return subSubCategory;
    }

    async remove(id: string): Promise<void> {
        const result = await this.subSubCategoryModel
            .findOneAndUpdate(
                { _id: id, isDeleted: false },
                { isDeleted: true },
                { new: true }
            )
            .exec();

        if (!result) {
            throw new NotFoundException(`SubSubCategory with ID ${id} not found`);
        }
    }
}

