import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
    CreateBranchDto,
    UpdateBranchDto,
    BranchQueryDto,
    UpdateSortOrderDto,
} from './dto';
import { User, UserDocument } from 'src/users/scheme/user.scheme';
import { Branch, BranchDocument } from './scheme/branche.scheme';

@Injectable()
export class BranchesService {
    constructor(
        @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) { }

    // Create new branch
    async create(createBranchDto: CreateBranchDto, userId: string): Promise<Branch> {
        const { code, managerId, isMainBranch } = createBranchDto;

        // Check if code already exists
        if (code) {
            const existingBranch = await this.branchModel.findOne({ code }).exec();
            if (existingBranch) {
                throw new ConflictException('Branch with this code already exists');
            }
        }

        // Validate manager if provided
        if (managerId) {
            const manager = await this.userModel.findById(managerId).exec();
            if (!manager || manager.isDeleted || !manager.isActive) {
                throw new NotFoundException('Manager not found or inactive');
            }
        }

        // Check if setting as main branch when others exist
        if (isMainBranch) {
            const existingMainBranch = await this.branchModel
                .findOne({ isMainBranch: true, isDeleted: { $ne: true } })
                .exec();
            if (existingMainBranch) {
                throw new ConflictException('A main branch already exists');
            }
        }

        const branch = new this.branchModel({
            ...createBranchDto,
            createdBy: userId,
            updatedBy: userId,
        });

        const savedBranch = await branch.save();

        // Update manager's branch assignment if provided
        if (managerId) {
            await this.userModel
                .findByIdAndUpdate(managerId, { branchId: savedBranch._id })
                .exec();
        }

        return savedBranch;
    }

    // Find all branches with pagination and filtering
    async findAll(query: BranchQueryDto) {
        const {
            page = 1,
            limit = 20,
            sort = 'sortOrder',
            isActive,
            isMainBranch,
            city,
            managerId,
            search,
        } = query;

        // Build filter
        const filter: any = { isDeleted: { $ne: true } };

        if (isActive !== undefined) filter.isActive = isActive;
        if (isMainBranch !== undefined) filter.isMainBranch = isMainBranch;
        if (city) filter['address.city'] = { $regex: city, $options: 'i' };
        if (managerId) filter.managerId = managerId;

        // Search filter
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { nameAr: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
                { 'address.city': { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
            ];
        }

        // Calculate pagination
        const skip = (page - 1) * limit;
        const total = await this.branchModel.countDocuments(filter).exec();
        const pages = Math.ceil(total / limit);

        // Get branches
        const branches = await this.branchModel
            .find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate('managerId', 'firstName lastName email')
            .populate('createdBy', 'firstName lastName')
            .exec();

        return {
            data: branches,
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

    // Find branch by ID
    async findById(id: string): Promise<Branch> {
        const branch = await this.branchModel
            .findById(id)
            .populate('managerId', 'firstName lastName email phone')
            .populate('createdBy', 'firstName lastName')
            .populate('updatedBy', 'firstName lastName')
            .exec();

        if (!branch || branch.isDeleted) {
            throw new NotFoundException('Branch not found');
        }

        return branch;
    }

    // Find branch by code
    async findByCode(code: string): Promise<Branch> {
        const branch = await this.branchModel
            .findOne({ code, isDeleted: { $ne: true } })
            .populate('managerId', 'firstName lastName email')
            .exec();

        if (!branch) {
            throw new NotFoundException('Branch not found');
        }

        return branch;
    }

    // Get active branches (for dropdowns, etc.)
    async getActiveBranches() {
        const branches = await this.branchModel
            .find({ isActive: true, isDeleted: { $ne: true } })
            .sort({ isMainBranch: -1, sortOrder: 1, name: 1 })
            .select('name nameAr code address.city managerId')
            .populate('managerId', 'firstName lastName')
            .exec();

        return branches;
    }

    // Get main branch
    async getMainBranch(): Promise<Branch> {
        const mainBranch = await this.branchModel
            .findOne({
                isMainBranch: true,
                isActive: true,
                isDeleted: { $ne: true }
            })
            .populate('managerId', 'firstName lastName email phone')
            .exec();

        if (!mainBranch) {
            throw new NotFoundException('Main branch not found');
        }

        return mainBranch;
    }

    // Update branch
    async update(id: string, updateBranchDto: UpdateBranchDto, userId: string): Promise<Branch> {
        const { code, managerId, isMainBranch } = updateBranchDto;

        // Check if code is being changed and if it's already taken
        if (code) {
            const existingBranch = await this.branchModel
                .findOne({ code, _id: { $ne: id } })
                .exec();
            if (existingBranch) {
                throw new ConflictException('Code already taken by another branch');
            }
        }

        // Validate manager if being changed
        if (managerId) {
            const manager = await this.userModel.findById(managerId).exec();
            if (!manager || manager.isDeleted || !manager.isActive) {
                throw new NotFoundException('Manager not found or inactive');
            }
        }

        // Handle main branch status change
        if (isMainBranch === true) {
            // Remove main branch status from other branches
            await this.branchModel
                .updateMany(
                    { _id: { $ne: id }, isMainBranch: true },
                    { isMainBranch: false }
                )
                .exec();
        }

        // Get current branch to handle manager change
        const currentBranch = await this.branchModel.findById(id).exec();
        if (!currentBranch || currentBranch.isDeleted) {
            throw new NotFoundException('Branch not found');
        }

        // Update previous manager's branch assignment
        if (currentBranch.managerId && managerId !== String(currentBranch.managerId)) {
            await this.userModel
                .findByIdAndUpdate(currentBranch.managerId, { branchId: null })
                .exec();
        }

        const branch = await this.branchModel
            .findByIdAndUpdate(
                id,
                { ...updateBranchDto, updatedBy: userId },
                { new: true }
            )
            .populate('managerId', 'firstName lastName email')
            .exec();

        if (!branch) {
            throw new NotFoundException('Branch not found');
        }

        // Update new manager's branch assignment
        if (managerId) {
            await this.userModel
                .findByIdAndUpdate(managerId, { branchId: id })
                .exec();
        }

        return branch;
    }

    // Toggle active status
    async toggleActive(id: string, userId: string): Promise<Branch> {
        const branch = await this.branchModel.findById(id).exec();
        if (!branch || branch.isDeleted) {
            throw new NotFoundException('Branch not found');
        }

        // Prevent deactivating the main branch
        if (branch.isMainBranch && branch.isActive) {
            throw new BadRequestException('Cannot deactivate the main branch');
        }

        branch.isActive = !branch.isActive;
        branch.updatedBy = userId as any;
        return await branch.save();
    }

    // Update sort order
    async updateSortOrder(id: string, sortOrder: number, userId: string): Promise<Branch> {
        const branch = await this.branchModel
            .findByIdAndUpdate(
                id,
                { sortOrder, updatedBy: userId },
                { new: true }
            )
            .exec();

        if (!branch || branch.isDeleted) {
            throw new NotFoundException('Branch not found');
        }

        return branch;
    }

    // Soft delete branch
    async remove(id: string, userId: string): Promise<void> {
        const branch = await this.branchModel.findById(id).exec();
        if (!branch || branch.isDeleted) {
            throw new NotFoundException('Branch not found');
        }

        // Prevent deleting the main branch
        if (branch.isMainBranch) {
            throw new BadRequestException('Cannot delete the main branch');
        }

        // Check if branch has employees
        const employeeCount = await this.userModel
            .countDocuments({ branchId: id, isDeleted: { $ne: true } })
            .exec();

        if (employeeCount > 0) {
            throw new BadRequestException(
                `Cannot delete branch with ${employeeCount} employees. Please reassign them first.`
            );
        }

        // Update manager's branch assignment
        if (branch.managerId) {
            await this.userModel
                .findByIdAndUpdate(branch.managerId, { branchId: null })
                .exec();
        }

        await this.branchModel
            .findByIdAndUpdate(id, {
                isDeleted: true,
                isActive: false,
                updatedBy: userId,
            })
            .exec();
    }

    // Get branch statistics
    async getBranchStats() {
        const totalBranches = await this.branchModel
            .countDocuments({ isDeleted: { $ne: true } })
            .exec();

        const activeBranches = await this.branchModel
            .countDocuments({ isActive: true, isDeleted: { $ne: true } })
            .exec();

        // Get branches by city
        const branchesByCity = await this.branchModel
            .aggregate([
                { $match: { isDeleted: { $ne: true } } },
                { $group: { _id: '$address.city', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ])
            .exec();

        // Get employee count per branch
        const employeesByBranch = await this.userModel
            .aggregate([
                {
                    $match: {
                        branchId: { $exists: true, $ne: null },
                        isDeleted: { $ne: true }
                    }
                },
                { $group: { _id: '$branchId', count: { $sum: 1 } } },
                {
                    $lookup: {
                        from: 'branches',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'branch'
                    }
                },
                { $unwind: '$branch' },
                {
                    $project: {
                        branchName: '$branch.name',
                        branchCode: '$branch.code',
                        employeeCount: '$count'
                    }
                },
                { $sort: { employeeCount: -1 } },
            ])
            .exec();

        const recentBranches = await this.branchModel
            .find({ isDeleted: { $ne: true } })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name nameAr code address.city isActive createdAt')
            .exec();

        return {
            totalBranches,
            activeBranches,
            inactiveBranches: totalBranches - activeBranches,
            branchesByCity,
            employeesByBranch,
            recentBranches,
        };
    }

    // Update branch employee count (called from other services)
    async updateEmployeeCount(branchId: string, increment: number = 1): Promise<void> {
        await this.branchModel
            .findByIdAndUpdate(branchId, { $inc: { employeeCount: increment } })
            .exec();
    }

    // Update branch sales/orders (called from other services)
    async updateBranchStats(branchId: string, salesAmount: number, orderCount: number = 1): Promise<void> {
        await this.branchModel
            .findByIdAndUpdate(branchId, {
                $inc: {
                    totalSales: salesAmount,
                    totalOrders: orderCount
                }
            })
            .exec();
    }
}