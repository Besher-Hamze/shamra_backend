import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
    CreateMerchantRequestDto,
    UpdateMerchantRequestDto,
    MerchantQueryDto,
    ReviewMerchantDto,
} from './dto';
import { Merchant, MerchantDocument } from './scheme/merchant.scheme';
import { User, UserDocument } from 'src/users/scheme/user.scheme';
import { UserRole } from 'src/common/enums';

@Injectable()
export class MerchantsService {
    constructor(
        @InjectModel(Merchant.name) private merchantModel: Model<MerchantDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) { }

    // Create merchant request
    async createRequest(createMerchantRequestDto: CreateMerchantRequestDto, userId: string): Promise<Merchant> {

        // Check if user already has a merchant request
        const existingRequest = await this.merchantModel.findOne({
            userId,
            isDeleted: { $ne: true }
        }).exec();

        if (existingRequest) {
            throw new ConflictException('You already have a merchant request');
        }

        // Check if email is already used by another merchant
        const existingMerchant = await this.merchantModel.findOne({
            userId,
            isDeleted: { $ne: true }
        }).exec();

        if (existingMerchant) {
            throw new ConflictException('This user is already registered for a merchant');
        }

        const merchant = new this.merchantModel({
            ...createMerchantRequestDto,
            userId,
        });

        return await merchant.save();
    }

    // Find all merchant requests with pagination
    async findAll(query: MerchantQueryDto) {
        const {
            page = 1,
            limit = 10,
            status,
            search,
        } = query;

        // Build filter
        const filter: any = { isDeleted: { $ne: true } };

        if (status) filter.status = status;

        if (search) {
            filter.$or = [
                { storeName: { $regex: search, $options: 'i' } },
                { user: { $regex: search, $options: 'i' } },
                { phoneNumber: { $regex: search, $options: 'i' } },
            ];
        }

        // Calculate pagination
        const skip = (page - 1) * limit;
        const total = await this.merchantModel.countDocuments(filter).exec();
        const pages = Math.ceil(total / limit);

        // Get merchants
        const merchants = await this.merchantModel
            .find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('user', 'firstName lastName ')
            .populate('reviewer', 'firstName lastName')
            .exec();

        return {
            data: merchants,
            pagination: {
                page,
                limit,
                total,
                pages,
                hasNext: page < pages,
                hasPrev: page > 1,
            },
        };
    }

    // Find merchant request by ID
    async findById(id: string): Promise<Merchant> {
        const merchant = await this.merchantModel
            .findById(id)
            .populate('user', 'firstName lastName ')
            .populate('reviewer', 'firstName lastName')
            .exec();

        if (!merchant || merchant.isDeleted) {
            throw new NotFoundException('Merchant request not found');
        }

        return merchant;
    }

    // Find merchant request by user ID
    async findByUserId(userId: string): Promise<Merchant | null> {
        const merchant = await this.merchantModel
            .findOne({ userId, isDeleted: { $ne: true } })
            .populate('user', 'firstName lastName')
            .populate('reviewer', 'firstName lastName')
            .exec();

        return merchant;
    }

    // Update merchant request (only if pending)
    async updateRequest(id: string, updateMerchantRequestDto: UpdateMerchantRequestDto): Promise<Merchant> {
        const merchant = await this.merchantModel.findById(id).exec();

        if (!merchant || merchant.isDeleted) {
            throw new NotFoundException('Merchant request not found');
        }

        if (merchant.status !== 'pending') {
            throw new BadRequestException('Cannot update approved or rejected requests');
        }

        const updatedMerchant = await this.merchantModel
            .findByIdAndUpdate(id, updateMerchantRequestDto, { new: true })
            .populate('user', 'firstName lastName ')
            .populate('reviewer', 'firstName lastName')
            .exec();

        return updatedMerchant;
    }

    // Review merchant request (approve/reject)
    async reviewRequest(id: string, reviewMerchantDto: ReviewMerchantDto, reviewedBy: string): Promise<Merchant> {
        const { status, rejectionReason } = reviewMerchantDto;

        const merchant = await this.merchantModel.findById(id).exec();

        if (!merchant || merchant.isDeleted) {
            throw new NotFoundException('Merchant request not found');
        }

        if (merchant.status !== 'pending') {
            throw new BadRequestException('This request has already been reviewed');
        }

        const updateData: any = {
            status,
            reviewedBy,
            reviewedAt: new Date(),
        };

        if (status === 'rejected' && rejectionReason) {
            updateData.rejectionReason = rejectionReason;
        }

        const updatedMerchant = await this.merchantModel
            .findByIdAndUpdate(id, updateData, { new: true })
            .populate('user', 'firstName lastName ')
            .populate('reviewer', 'firstName lastName')
            .exec();

        // If approved, update user role to merchant
        if (status === 'approved') {
            await this.userModel.findByIdAndUpdate(merchant.userId, {
                role: UserRole.MERCHANT
            }).exec();
        }

        return updatedMerchant;
    }

    // Soft delete merchant request
    async remove(id: string): Promise<void> {
        const merchant = await this.merchantModel.findById(id).exec();

        if (!merchant || merchant.isDeleted) {
            throw new NotFoundException('Merchant request not found');
        }

        await this.merchantModel
            .findByIdAndUpdate(id, { isDeleted: true })
            .exec();
    }

    // Get merchant statistics
    async getStatistics() {
        const total = await this.merchantModel.countDocuments({ isDeleted: { $ne: true } }).exec();
        const pending = await this.merchantModel.countDocuments({
            status: 'pending',
            isDeleted: { $ne: true }
        }).exec();
        const approved = await this.merchantModel.countDocuments({
            status: 'approved',
            isDeleted: { $ne: true }
        }).exec();
        const rejected = await this.merchantModel.countDocuments({
            status: 'rejected',
            isDeleted: { $ne: true }
        }).exec();

        return {
            total,
            pending,
            approved,
            rejected,
        };
    }
}
