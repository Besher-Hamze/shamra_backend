import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import {
    CreateUserDto,
    UpdateUserDto,
    ChangePasswordDto,
    UserQueryDto,
} from './dto';
import { User, UserDocument } from './scheme/user.scheme';
import { UserRole } from 'src/common/enums';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) { }

    // Create new user
    async create(createUserDto: CreateUserDto): Promise<User> {
        const { email, password } = createUserDto;

        // Check if user already exists
        const existingUser = await this.userModel.findOne({ email }).exec();
        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        const user = new this.userModel({
            ...createUserDto,
            password: hashedPassword,
        });

        return await user.save();
    }

    // Find all users with pagination
    async findAll(query: UserQueryDto) {
        const {
            page = 1,
            limit = 10,
            role,
            branchId,
            isActive,
            search,
        } = query;

        // Build filter
        const filter: any = { isDeleted: { $ne: true } };

        if (role) filter.role = role;
        if (branchId) filter.branchId = branchId;
        if (isActive !== undefined) filter.isActive = isActive;

        if (search) {
            filter.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        // Calculate pagination
        const skip = (page - 1) * limit;
        const total = await this.userModel.countDocuments(filter).exec();
        const pages = Math.ceil(total / limit);

        // Get users
        const users = await this.userModel
            .find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('branchId', 'name')
            .exec();

        return {
            data: users,
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

    // Find user by ID
    async findById(id: string): Promise<User> {
        const user = await this.userModel
            .findById(id)
            .lean()
            .exec();

        if (!user || user.isDeleted) {
            throw new NotFoundException('User not found');
        }
        
        return user;
    }

    // Find user by email (for authentication)
    async findByEmail(email: string): Promise<User | null> {
        const user = await this.userModel
            .findOne({ email, isDeleted: { $ne: true } })
            .select('+password')
            .lean()
            .exec() as any;
        return user;
    }

    // Update user
    async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        const { email } = updateUserDto;

        // Check if email is being changed and if it's already taken
        if (email) {
            const existingUser = await this.userModel
                .findOne({ email, _id: { $ne: id } })
                .exec();
            if (existingUser) {
                throw new ConflictException('Email already taken');
            }
        }

        const user = await this.userModel
            .findByIdAndUpdate(id, updateUserDto, { new: true })
            .exec();

        if (!user || user.isDeleted) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    // Change password
    async changePassword(
        id: string,
        changePasswordDto: ChangePasswordDto,
    ): Promise<void> {
        const { currentPassword, newPassword } = changePasswordDto;

        const user = await this.userModel.findById(id).select('+password').exec();
        if (!user || user.isDeleted) {
            throw new NotFoundException('User not found');
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new BadRequestException('Current password is incorrect');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        await this.userModel
            .findByIdAndUpdate(id, { password: hashedPassword })
            .exec();
    }

    // Soft delete user
    async remove(id: string): Promise<void> {
        const user = await this.userModel.findById(id).exec();
        if (!user || user.isDeleted) {
            throw new NotFoundException('User not found');
        }

        await this.userModel
            .findByIdAndUpdate(id, { isDeleted: true, isActive: false })
            .exec();
    }

    // Toggle active status
    async toggleActive(id: string): Promise<User> {
        const user = await this.userModel.findById(id).exec();
        if (!user || user.isDeleted) {
            throw new NotFoundException('User not found');
        }

        user.isActive = !user.isActive;
        return await user.save();
    }

    // Update last login
    async updateLastLogin(id: string): Promise<void> {
        await this.userModel
            .findByIdAndUpdate(id, { lastLoginAt: new Date() })
            .exec();
    }

    changeRole(id: string, role: UserRole): Promise<User> {
        return this.userModel.findByIdAndUpdate(id, { role: role }, { new: true }).exec();
    }

}