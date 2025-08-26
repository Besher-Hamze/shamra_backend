import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
    CreateCustomerDto,
    UpdateCustomerDto,
    CustomerQueryDto,
    UpdateCustomerStatsDto,
} from './dto';
import { Customer, CustomerDocument } from './scheme/customer.scheme';

@Injectable()
export class CustomersService {
    constructor(
        @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    ) { }

    // Create new customer
    async create(createCustomerDto: CreateCustomerDto, userId: string): Promise<Customer> {
        const { email, customerCode } = createCustomerDto;

        // Check if email already exists
        const existingEmail = await this.customerModel.findOne({ email }).exec();
        if (existingEmail) {
            throw new ConflictException('Customer with this email already exists');
        }

        // Check if customer code already exists
        if (customerCode) {
            const existingCode = await this.customerModel.findOne({ customerCode }).exec();
            if (existingCode) {
                throw new ConflictException('Customer code already exists');
            }
        }

        const customer = new this.customerModel({
            ...createCustomerDto,
            createdBy: userId,
            updatedBy: userId,
        });

        return await customer.save();
    }

    // Find all customers with pagination
    async findAll(query: CustomerQueryDto) {
        const {
            page = 1,
            limit = 20,
            sort = '-createdAt',
            isActive,
            city,
            search,
        } = query;

        // Build filter
        const filter: any = { isDeleted: { $ne: true } };

        if (isActive !== undefined) filter.isActive = isActive;
        if (city) filter['address.city'] = { $regex: city, $options: 'i' };

        if (search) {
            filter.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phoneNumber: { $regex: search, $options: 'i' } },
                { customerCode: { $regex: search, $options: 'i' } },
            ];
        }

        // Calculate pagination
        const skip = (page - 1) * limit;
        const total = await this.customerModel.countDocuments(filter).exec();
        const pages = Math.ceil(total / limit);

        // Get customers
        const customers = await this.customerModel
            .find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate('createdBy', 'firstName lastName')
            .exec();

        return {
            data: customers,
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

    // Find customer by ID
    async findById(id: string): Promise<Customer> {
        const customer = await this.customerModel
            .findById(id)
            .populate('createdBy', 'firstName lastName')
            .populate('updatedBy', 'firstName lastName')
            .exec();

        if (!customer || customer.isDeleted) {
            throw new NotFoundException('Customer not found');
        }

        return customer;
    }

    // Find customer by email
    async findByEmail(email: string): Promise<Customer> {
        const customer = await this.customerModel
            .findOne({ email, isDeleted: { $ne: true } })
            .exec();

        if (!customer) {
            throw new NotFoundException('Customer not found');
        }

        return customer;
    }

    // Find customer by customer code
    async findByCustomerCode(customerCode: string): Promise<Customer> {
        const customer = await this.customerModel
            .findOne({ customerCode, isDeleted: { $ne: true } })
            .exec();

        if (!customer) {
            throw new NotFoundException('Customer not found');
        }

        return customer;
    }

    // Update customer
    async update(id: string, updateCustomerDto: UpdateCustomerDto, userId: string): Promise<Customer> {
        const { email, customerCode } = updateCustomerDto;

        // Check if email is being changed and if it's already taken
        if (email) {
            const existingEmail = await this.customerModel
                .findOne({ email, _id: { $ne: id } })
                .exec();
            if (existingEmail) {
                throw new ConflictException('Email already taken by another customer');
            }
        }

        // Check if customer code is being changed and if it's already taken
        if (customerCode) {
            const existingCode = await this.customerModel
                .findOne({ customerCode, _id: { $ne: id } })
                .exec();
            if (existingCode) {
                throw new ConflictException('Customer code already taken');
            }
        }

        const customer = await this.customerModel
            .findByIdAndUpdate(
                id,
                { ...updateCustomerDto, updatedBy: userId },
                { new: true }
            )
            .exec();

        if (!customer || customer.isDeleted) {
            throw new NotFoundException('Customer not found');
        }

        return customer;
    }

    // Toggle active status
    async toggleActive(id: string, userId: string): Promise<Customer> {
        const customer = await this.customerModel.findById(id).exec();
        if (!customer || customer.isDeleted) {
            throw new NotFoundException('Customer not found');
        }

        customer.isActive = !customer.isActive;
        customer.updatedBy = userId as any;
        return await customer.save();
    }

    // Soft delete customer
    async remove(id: string, userId: string): Promise<void> {
        const customer = await this.customerModel.findById(id).exec();
        if (!customer || customer.isDeleted) {
            throw new NotFoundException('Customer not found');
        }

        await this.customerModel
            .findByIdAndUpdate(id, {
                isDeleted: true,
                isActive: false,
                updatedBy: userId,
            })
            .exec();
    }

    // Update customer statistics (called from orders service)
    async updateStats(customerId: string, updateStatsDto: UpdateCustomerStatsDto): Promise<void> {
        const updates: any = {};

        if (updateStatsDto.totalOrders !== undefined) {
            updates.totalOrders = updateStatsDto.totalOrders;
        }

        if (updateStatsDto.totalSpent !== undefined) {
            updates.totalSpent = updateStatsDto.totalSpent;
        }

        updates.lastOrderDate = new Date();

        await this.customerModel
            .findByIdAndUpdate(customerId, updates)
            .exec();
    }

    // Get top customers by spending
    async getTopCustomers(limit: number = 10) {
        const customers = await this.customerModel
            .find({
                isActive: true,
                isDeleted: { $ne: true },
                totalSpent: { $gt: 0 }
            })
            .sort({ totalSpent: -1 })
            .limit(limit)
            .select('firstName lastName email customerCode totalSpent totalOrders')
            .exec();

        return customers;
    }

    // Get recent customers
    async getRecentCustomers(limit: number = 10) {
        const customers = await this.customerModel
            .find({ isDeleted: { $ne: true } })
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('firstName lastName email customerCode totalSpent createdAt')
            .exec();

        return customers;
    }

    // Get customer statistics
    async getCustomerStats() {
        const totalCustomers = await this.customerModel
            .countDocuments({ isDeleted: { $ne: true } })
            .exec();

        const activeCustomers = await this.customerModel
            .countDocuments({ isActive: true, isDeleted: { $ne: true } })
            .exec();

        const customersWithOrders = await this.customerModel
            .countDocuments({ totalOrders: { $gt: 0 }, isDeleted: { $ne: true } })
            .exec();

        // Customers by city
        const customersByCity = await this.customerModel
            .aggregate([
                { $match: { isDeleted: { $ne: true } } },
                { $group: { _id: '$address.city', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ])
            .exec();

        // Total revenue from customers
        const revenueStats = await this.customerModel
            .aggregate([
                { $match: { isDeleted: { $ne: true } } },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$totalSpent' },
                        avgOrderValue: { $avg: '$totalSpent' }
                    }
                }
            ])
            .exec();

        const topCustomers = await this.getTopCustomers(5);
        const recentCustomers = await this.getRecentCustomers(5);

        return {
            totalCustomers,
            activeCustomers,
            inactiveCustomers: totalCustomers - activeCustomers,
            customersWithOrders,
            customersByCity,
            totalRevenue: revenueStats[0]?.totalRevenue || 0,
            averageCustomerValue: revenueStats[0]?.avgOrderValue || 0,
            topCustomers,
            recentCustomers,
        };
    }
}