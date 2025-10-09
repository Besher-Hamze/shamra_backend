import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Settings, SettingsDocument } from './scheme/settings.scheme';
import { CreateSettingDto, UpdateSettingDto, SettingsQueryDto, BulkUpdateSettingsDto } from './dto';

@Injectable()
export class SettingsService {
    private cache: Map<string, any> = new Map();
    private cacheExpiry: Map<string, number> = new Map();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    constructor(
        @InjectModel(Settings.name) private settingsModel: Model<SettingsDocument>,
    ) {
        this.initializeDefaultSettings();
    }

    private async initializeDefaultSettings() {
        const defaultSettings = [
            {
                key: 'company_name',
                value: 'Shamra Electronics',
                description: 'Company Name',
                descriptionAr: 'اسم الشركة',
                type: 'string',
                category: 'business',
                isPublic: true,
                isEditable: true,
            },
            {
                key: 'company_name_ar',
                value: 'شركة شمرا للإلكترونيات',
                description: 'Company Name in Arabic',
                descriptionAr: 'اسم الشركة بالعربية',
                type: 'string',
                category: 'business',
                isPublic: true,
                isEditable: true,
            },
            {
                key: 'company_email',
                value: 'info@shamra.com',
                description: 'Company Email',
                descriptionAr: 'البريد الإلكتروني للشركة',
                type: 'string',
                category: 'business',
                isPublic: true,
                isEditable: true,
            },
            {
                key: 'company_phone',
                value: '+963 11 123 4567',
                description: 'Company Phone',
                descriptionAr: 'هاتف الشركة',
                type: 'string',
                category: 'business',
                isPublic: true,
                isEditable: true,
            },
            {
                key: 'currency',
                value: 'SYP',
                description: 'Default Currency',
                descriptionAr: 'العملة الافتراضية',
                type: 'string',
                category: 'business',
                isPublic: true,
                isEditable: true,
            },
            {
                key: 'tax_rate',
                value: 0.15,
                description: 'Default Tax Rate',
                descriptionAr: 'معدل الضريبة الافتراضي',
                type: 'number',
                category: 'business',
                isPublic: false,
                isEditable: true,
            },
            {
                key: 'low_stock_threshold',
                value: 5,
                description: 'Low Stock Threshold',
                descriptionAr: 'حد المخزون المنخفض',
                type: 'number',
                category: 'system',
                isPublic: false,
                isEditable: true,
            },
            {
                key: 'order_auto_confirm',
                value: false,
                description: 'Auto Confirm Orders',
                descriptionAr: 'تأكيد الطلبات تلقائياً',
                type: 'boolean',
                category: 'system',
                isPublic: false,
                isEditable: true,
            },
            {
                key: 'email_notifications',
                value: true,
                description: 'Enable Email Notifications',
                descriptionAr: 'تفعيل إشعارات البريد الإلكتروني',
                type: 'boolean',
                category: 'notification',
                isPublic: false,
                isEditable: true,
            },
            {
                key: 'sms_notifications',
                value: false,
                description: 'Enable SMS Notifications',
                descriptionAr: 'تفعيل إشعارات الرسائل النصية',
                type: 'boolean',
                category: 'notification',
                isPublic: false,
                isEditable: true,
            },
            {
                key: 'points_enabled',
                value: true,
                description: 'Enable Points System',
                descriptionAr: 'تفعيل نظام النقاط',
                type: 'boolean',
                category: 'system',
                isPublic: false,
                isEditable: true,
            },

            // 💵 الدولار - كل 100$ = 10 نقاط
            {
                key: 'points_rate_usd',
                value: 10, // 10 نقاط لكل 100 دولار
                description: 'Points earned per 100 USD',
                descriptionAr: 'النقاط المكتسبة لكل 100 دولار',
                type: 'number',
                category: 'system',
                isPublic: true,
                isEditable: true,
            },

            // 💰 الليرة السورية - كل 100,000 ل.س = 10 نقاط
            {
                key: 'points_rate_syp',
                value: 10, // 10 نقاط لكل 100,000 ليرة سورية
                description: 'Points earned per 100,000 SYP',
                descriptionAr: 'النقاط المكتسبة لكل 100,000 ليرة سورية',
                type: 'number',
                category: 'system',
                isPublic: true,
                isEditable: true,
            },

            // 🇹🇷 الليرة التركية - كل 1,000 ₺ = 10 نقاط
            {
                key: 'points_rate_try',
                value: 10, // 10 نقاط لكل 1,000 ليرة تركية
                description: 'Points earned per 1,000 TRY',
                descriptionAr: 'النقاط المكتسبة لكل 1,000 ليرة تركية',
                type: 'number',
                category: 'system',
                isPublic: true,
                isEditable: true,
            },

            // 🎁 قيمة الخصم للنقاط (قابل للتعديل)
            {
                key: 'points_discount_rate',
                value: 1, // 1 نقطة = 1% خصم
                description: 'Discount percentage per point (1 point = 1%)',
                descriptionAr: 'نسبة الخصم لكل نقطة (1 نقطة = 1%)',
                type: 'number',
                category: 'system',
                isPublic: true,
                isEditable: true,
            },

            // 🛡️ حد أقصى للخصم بالنقاط
            {
                key: 'points_max_discount_percent',
                value: 50, // حد أقصى 50% خصم
                description: 'Maximum discount percentage using points',
                descriptionAr: 'الحد الأقصى لنسبة الخصم بالنقاط',
                type: 'number',
                category: 'system',
                isPublic: true,
                isEditable: true,
            },

        ];

        for (const setting of defaultSettings) {
            try {
                await this.create(setting as CreateSettingDto, 'system');
            } catch (error) {
                // Setting already exists, skip
            }
        }
    }

    async create(createSettingDto: CreateSettingDto, userId: string): Promise<Settings> {
        // Check if setting already exists
        const existingSetting = await this.settingsModel.findOne({
            key: createSettingDto.key,
            isDeleted: false,
        });

        if (existingSetting) {
            throw new ConflictException('الإعداد موجود بالفعل');
        }

        const setting = new this.settingsModel({
            ...createSettingDto,
            createdBy: userId,
            updatedBy: userId,
        });

        const savedSetting = await setting.save();

        // Clear cache for this key
        this.cache.delete(createSettingDto.key);

        return savedSetting;
    }

    async findAll(query: SettingsQueryDto) {
        const { page = 1, limit = 20, search, category, isPublic, isEditable } = query;
        const skip = (page - 1) * limit;

        const filter: any = { isDeleted: false };

        if (search) {
            filter.$text = { $search: search };
        }
        if (category) filter.category = category;
        if (isPublic !== undefined) filter.isPublic = isPublic;
        if (isEditable !== undefined) filter.isEditable = isEditable;

        const [settings, total] = await Promise.all([
            this.settingsModel
                .find(filter)
                .sort({ category: 1, key: 1 })
                .skip(skip)
                .limit(limit)
                .populate('createdBy', 'firstName lastName')
                .populate('updatedBy', 'firstName lastName')
                .exec(),
            this.settingsModel.countDocuments(filter),
        ]);

        return {
            data: settings,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(key: string): Promise<Settings> {
        const setting = await this.settingsModel
            .findOne({ key, isDeleted: false })
            .populate('createdBy', 'firstName lastName')
            .populate('updatedBy', 'firstName lastName')
            .exec();

        if (!setting) {
            throw new NotFoundException('الإعداد غير موجود');
        }

        return setting;
    }

    async getValue(key: string, defaultValue?: any): Promise<any> {
        // Check cache first
        const cached = this.cache.get(key);
        const expiry = this.cacheExpiry.get(key);

        if (cached && expiry && Date.now() < expiry) {
            return cached;
        }

        try {
            const setting = await this.findOne(key);
            const value = setting.value;

            // Cache the value
            this.cache.set(key, value);
            this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);

            return value;
        } catch (error) {
            if (defaultValue !== undefined) {
                return defaultValue;
            }
            throw error;
        }
    }

    async getMultipleValues(keys: string[]): Promise<Record<string, any>> {
        const result: Record<string, any> = {};

        await Promise.all(
            keys.map(async (key) => {
                try {
                    result[key] = await this.getValue(key);
                } catch (error) {
                    result[key] = null;
                }
            })
        );

        return result;
    }

    async getPublicSettings(): Promise<Record<string, any>> {
        const settings = await this.settingsModel
            .find({ isPublic: true, isDeleted: false })
            .select('key value description descriptionAr type category')
            .exec();

        const result: Record<string, any> = {};
        settings.forEach(setting => {
            result[setting.key] = {
                value: setting.value,
                description: setting.description,
                descriptionAr: setting.descriptionAr,
                type: setting.type,
                category: setting.category,
            };
        });

        return result;
    }

    async update(key: string, updateSettingDto: UpdateSettingDto, userId: string): Promise<Settings> {
        const setting = await this.settingsModel.findOneAndUpdate(
            { key, isDeleted: false },
            {
                ...updateSettingDto,
                updatedBy: userId,
            },
            { new: true }
        );

        if (!setting) {
            throw new NotFoundException('الإعداد غير موجود');
        }

        // Clear cache for this key
        this.cache.delete(key);

        return setting;
    }

    async bulkUpdate(bulkUpdateSettingsDto: BulkUpdateSettingsDto, userId: string): Promise<Settings[]> {
        const { settings } = bulkUpdateSettingsDto;
        const updatedSettings: Settings[] = [];

        for (const item of settings) {
            try {
                const setting = await this.update(item.key, { value: item.value }, userId);
                updatedSettings.push(setting);
            } catch (error) {
                // Log error but continue with other settings
                console.error(`Failed to update setting ${item.key}:`, error);
            }
        }

        return updatedSettings;
    }

    async remove(key: string, userId: string): Promise<void> {
        const setting = await this.settingsModel.findOneAndUpdate(
            { key, isDeleted: false },
            {
                isDeleted: true,
                updatedBy: userId,
            }
        );

        if (!setting) {
            throw new NotFoundException('الإعداد غير موجود');
        }

        // Clear cache for this key
        this.cache.delete(key);
    }

    async getSettingsByCategory(category: string): Promise<Settings[]> {
        return await this.settingsModel
            .find({ category, isDeleted: false })
            .sort({ key: 1 })
            .populate('createdBy', 'firstName lastName')
            .populate('updatedBy', 'firstName lastName')
            .exec();
    }

    async resetToDefault(key: string, userId: string): Promise<Settings> {
        // This would typically reset to a predefined default value
        // For now, we'll just mark it as editable
        const setting = await this.settingsModel.findOneAndUpdate(
            { key, isDeleted: false },
            {
                isEditable: true,
                updatedBy: userId,
            },
            { new: true }
        );

        if (!setting) {
            throw new NotFoundException('الإعداد غير موجود');
        }

        // Clear cache for this key
        this.cache.delete(key);

        return setting;
    }

    async clearCache(): Promise<void> {
        this.cache.clear();
        this.cacheExpiry.clear();
    }

    async getCacheStats(): Promise<{ size: number; keys: string[] }> {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
        };
    }
}
