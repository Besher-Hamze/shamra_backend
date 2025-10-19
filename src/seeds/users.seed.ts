import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/scheme/user.scheme';
import { Branch, BranchDocument } from '../branches/scheme/branche.scheme';
import { UserRole } from '../common/enums';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersSeedService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
    ) { }

    async seed() {
        try {
            console.log('🌱 Starting users seeding...');

            // Check if users already exist
            const existingUsers = await this.userModel.countDocuments();
            if (existingUsers > 0) {
                console.log('⚠️  Users already exist, skipping seeding...');
                return;
            }

            // Create default branch if it doesn't exist
            let defaultBranch = await this.branchModel.findOne({ name: 'Main Branch' });
            if (!defaultBranch) {
                defaultBranch = await this.branchModel.create({
                    name: 'Main Branch',
                    nameAr: 'الفرع الرئيسي',
                    description: 'Main branch in Damascus',
                    descriptionAr: 'الفرع الرئيسي في دمشق',
                    phone: '+963 11 123 4567',
                    email: 'main@shamra.com',
                    address: {
                        street: 'Main Street 123',
                        city: 'Damascus',
                        country: 'Syria',
                        coordinates: {
                            lat: 33.5138,
                            lng: 36.2765,
                        },
                    },
                    isActive: true,
                    isMainBranch: true,
                    code: 'BR001',
                });
                console.log('✅ Default branch created');
            }

            // Create Admin User
            const adminPassword = await bcrypt.hash('admin123', 12);
            const adminUser = await this.userModel.create({
                firstName: 'Admin',
                lastName: 'User',
                password: adminPassword,
                role: UserRole.ADMIN,
                phoneNumber: '+963945739573',
                branchId: defaultBranch._id,
                isActive: true,
                isEmailVerified: true,
                isPhoneVerified: true,
                profilePicture: null,
                address: {
                    street: 'Admin Street 1',
                    city: 'Damascus',
                    country: 'Syria',
                },
                preferences: {
                    language: 'en',
                    theme: 'light',
                    notifications: {
                        email: true,
                        sms: true,
                        push: true,
                    },
                },
            });

            // Create Manager User
            const managerPassword = await bcrypt.hash('manager123', 12);
            const managerUser = await this.userModel.create({
                firstName: 'Manager',
                lastName: 'User',
                email: 'manager@shamra.com',
                password: managerPassword,
                role: UserRole.MANAGER,
                phoneNumber: '+963 11 222 2222',
                branchId: defaultBranch._id,
                isActive: true,
                isEmailVerified: true,
                isPhoneVerified: true,
                profilePicture: null,
                address: {
                    street: 'Manager Street 2',
                    city: 'Damascus',
                    country: 'Syria',
                },
                preferences: {
                    language: 'en',
                    theme: 'light',
                    notifications: {
                        email: true,
                        sms: false,
                        push: true,
                    },
                },
            });

            // Create Employee User
            const employeePassword = await bcrypt.hash('employee123', 12);
            const employeeUser = await this.userModel.create({
                firstName: 'Employee',
                lastName: 'User',
                email: 'employee@shamra.com',
                password: employeePassword,
                role: UserRole.EMPLOYEE,
                phoneNumber: '+963 11 333 3333',
                branchId: defaultBranch._id,
                isActive: true,
                isEmailVerified: true,
                isPhoneVerified: true,
                profilePicture: null,
                address: {
                    street: 'Employee Street 3',
                    city: 'Damascus',
                    country: 'Syria',
                },
                preferences: {
                    language: 'ar',
                    theme: 'dark',
                    notifications: {
                        email: false,
                        sms: true,
                        push: true,
                    },
                },
            });

            console.log('✅ Users seeded successfully!');
            console.log('📋 Created Users:');
            console.log(`   👑 Admin: ${adminUser.email} (Password: admin123)`);
            console.log(`   👨‍💼 Manager: ${managerUser.email} (Password: manager123)`);
            console.log(`   👷 Employee: ${employeeUser.email} (Password: employee123)`);
            console.log('🔑 Use these credentials to login and test the system');

            return {
                admin: adminUser,
                manager: managerUser,
                employee: employeeUser,
            };
        } catch (error) {
            console.error('❌ Error seeding users:', error);
            throw error;
        }
    }

    async clear() {
        try {
            console.log('🧹 Clearing users...');
            await this.userModel.deleteMany({});
            console.log('✅ Users cleared successfully!');
        } catch (error) {
            console.error('❌ Error clearing users:', error);
            throw error;
        }
    }
}
