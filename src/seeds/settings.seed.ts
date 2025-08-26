import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Settings, SettingsDocument } from '../settings/scheme/settings.scheme';

@Injectable()
export class SettingsSeedService {
  constructor(
    @InjectModel(Settings.name) private settingsModel: Model<SettingsDocument>,
  ) {}

  async seed() {
    try {
      console.log('🌱 Starting settings seeding...');

      // Check if settings already exist
      const existingSettings = await this.settingsModel.countDocuments();
      if (existingSettings > 0) {
        console.log('⚠️  Settings already exist, skipping seeding...');
        return;
      }

      const settings = [
        // Company Information
        {
          key: 'company_name',
          value: 'Shamra Electronics',
          description: 'Company name',
          descriptionAr: 'اسم الشركة',
          type: 'string',
          category: 'business',
          isPublic: true,
          isEditable: true,
        },
        {
          key: 'company_name_ar',
          value: 'شركة شمرا للإلكترونيات',
          description: 'Company name in Arabic',
          descriptionAr: 'اسم الشركة بالعربية',
          type: 'string',
          category: 'business',
          isPublic: true,
          isEditable: true,
        },
        {
          key: 'company_description',
          value: 'Leading electronics retailer in Syria',
          description: 'Company description',
          descriptionAr: 'وصف الشركة',
          type: 'string',
          category: 'business',
          isPublic: true,
          isEditable: true,
        },
        {
          key: 'company_description_ar',
          value: 'متجر الإلكترونيات الرائد في سوريا',
          description: 'Company description in Arabic',
          descriptionAr: 'وصف الشركة بالعربية',
          type: 'string',
          category: 'business',
          isPublic: true,
          isEditable: true,
        },
        {
          key: 'company_phone',
          value: '+963 11 123 4567',
          description: 'Company phone number',
          descriptionAr: 'رقم هاتف الشركة',
          type: 'string',
          category: 'business',
          isPublic: true,
          isEditable: true,
        },
        {
          key: 'company_email',
          value: 'info@shamra.com',
          description: 'Company email address',
          descriptionAr: 'عنوان البريد الإلكتروني للشركة',
          type: 'string',
          category: 'business',
          isPublic: true,
          isEditable: true,
        },
        {
          key: 'company_address',
          value: 'Damascus, Syria',
          description: 'Company address',
          descriptionAr: 'عنوان الشركة',
          type: 'string',
          category: 'business',
          isPublic: true,
          isEditable: true,
        },
        {
          key: 'company_address_ar',
          value: 'دمشق، سوريا',
          description: 'Company address in Arabic',
          descriptionAr: 'عنوان الشركة بالعربية',
          type: 'string',
          category: 'business',
          isPublic: true,
          isEditable: true,
        },
        {
          key: 'company_website',
          value: 'https://shamra.com',
          description: 'Company website URL',
          descriptionAr: 'رابط موقع الشركة',
          type: 'string',
          category: 'business',
          isPublic: true,
          isEditable: true,
        },

        // Business Settings
        {
          key: 'currency',
          value: 'SYP',
          description: 'Default currency',
          descriptionAr: 'العملة الافتراضية',
          type: 'string',
          category: 'business',
          isPublic: true,
          isEditable: true,
        },
        {
          key: 'currency_symbol',
          value: 'ل.س',
          description: 'Currency symbol',
          descriptionAr: 'رمز العملة',
          type: 'string',
          category: 'business',
          isPublic: true,
          isEditable: true,
        },
        {
          key: 'tax_rate',
          value: 15,
          description: 'Default tax rate percentage',
          descriptionAr: 'نسبة الضريبة الافتراضية',
          type: 'number',
          category: 'business',
          isPublic: true,
          isEditable: true,
        },
        {
          key: 'delivery_fee',
          value: 50000,
          description: 'Default delivery fee',
          descriptionAr: 'رسوم التوصيل الافتراضية',
          type: 'number',
          category: 'business',
          isPublic: true,
          isEditable: true,
        },
        {
          key: 'min_order_amount',
          value: 100000,
          description: 'Minimum order amount for free delivery',
          descriptionAr: 'الحد الأدنى للطلب للتوصيل المجاني',
          type: 'number',
          category: 'business',
          isPublic: true,
          isEditable: true,
        },
        {
          key: 'working_hours',
          value: {
            monday: { open: '09:00', close: '18:00' },
            tuesday: { open: '09:00', close: '18:00' },
            wednesday: { open: '09:00', close: '18:00' },
            thursday: { open: '09:00', close: '18:00' },
            friday: { open: '09:00', close: '18:00' },
            saturday: { open: '09:00', close: '16:00' },
            sunday: { open: '10:00', close: '16:00' },
          },
          description: 'Working hours for all branches',
          descriptionAr: 'ساعات العمل لجميع الفروع',
          type: 'object',
          category: 'business',
          isPublic: true,
          isEditable: true,
        },

        // Email Settings
        {
          key: 'smtp_host',
          value: 'smtp.gmail.com',
          description: 'SMTP server host',
          descriptionAr: 'خادم SMTP',
          type: 'string',
          category: 'email',
          isPublic: false,
          isEditable: true,
        },
        {
          key: 'smtp_port',
          value: 587,
          description: 'SMTP server port',
          descriptionAr: 'منفذ خادم SMTP',
          type: 'number',
          category: 'email',
          isPublic: false,
          isEditable: true,
        },
        {
          key: 'smtp_secure',
          value: true,
          description: 'Use secure SMTP connection',
          descriptionAr: 'استخدام اتصال SMTP آمن',
          type: 'boolean',
          category: 'email',
          isPublic: false,
          isEditable: true,
        },
        {
          key: 'email_from_name',
          value: 'Shamra Electronics',
          description: 'Default sender name for emails',
          descriptionAr: 'اسم المرسل الافتراضي للرسائل',
          type: 'string',
          category: 'email',
          isPublic: false,
          isEditable: true,
        },
        {
          key: 'email_from_address',
          value: 'noreply@shamra.com',
          description: 'Default sender email address',
          descriptionAr: 'عنوان البريد الإلكتروني للمرسل الافتراضي',
          type: 'string',
          category: 'email',
          isPublic: false,
          isEditable: true,
        },

        // Notification Settings
        {
          key: 'notifications_enabled',
          value: true,
          description: 'Enable system notifications',
          descriptionAr: 'تفعيل إشعارات النظام',
          type: 'boolean',
          category: 'notification',
          isPublic: true,
          isEditable: true,
        },
        {
          key: 'email_notifications',
          value: true,
          description: 'Enable email notifications',
          descriptionAr: 'تفعيل إشعارات البريد الإلكتروني',
          type: 'boolean',
          category: 'notification',
          isPublic: true,
          isEditable: true,
        },
        {
          key: 'sms_notifications',
          value: false,
          description: 'Enable SMS notifications',
          descriptionAr: 'تفعيل إشعارات الرسائل النصية',
          type: 'boolean',
          category: 'notification',
          isPublic: true,
          isEditable: true,
        },
        {
          key: 'push_notifications',
          value: true,
          description: 'Enable push notifications',
          descriptionAr: 'تفعيل الإشعارات الفورية',
          type: 'boolean',
          category: 'notification',
          isPublic: true,
          isEditable: true,
        },

        // System Settings
        {
          key: 'maintenance_mode',
          value: false,
          description: 'Enable maintenance mode',
          descriptionAr: 'تفعيل وضع الصيانة',
          type: 'boolean',
          category: 'system',
          isPublic: true,
          isEditable: true,
        },
        {
          key: 'maintenance_message',
          value: 'System is under maintenance. Please try again later.',
          description: 'Maintenance mode message',
          descriptionAr: 'رسالة وضع الصيانة',
          type: 'string',
          category: 'system',
          isPublic: true,
          isEditable: true,
        },
        {
          key: 'maintenance_message_ar',
          value: 'النظام قيد الصيانة. يرجى المحاولة مرة أخرى لاحقاً.',
          description: 'Maintenance mode message in Arabic',
          descriptionAr: 'رسالة وضع الصيانة بالعربية',
          type: 'string',
          category: 'system',
          isPublic: true,
          isEditable: true,
        },
        {
          key: 'session_timeout',
          value: 3600,
          description: 'Session timeout in seconds',
          descriptionAr: 'مهلة الجلسة بالثواني',
          type: 'number',
          category: 'system',
          isPublic: false,
          isEditable: true,
        },
        {
          key: 'max_login_attempts',
          value: 5,
          description: 'Maximum login attempts before lockout',
          descriptionAr: 'الحد الأقصى لمحاولات تسجيل الدخول قبل القفل',
          type: 'number',
          category: 'system',
          isPublic: false,
          isEditable: true,
        },
        {
          key: 'lockout_duration',
          value: 900,
          description: 'Account lockout duration in seconds',
          descriptionAr: 'مدة قفل الحساب بالثواني',
          type: 'number',
          category: 'system',
          isPublic: false,
          isEditable: true,
        },

        // Payment Settings
        {
          key: 'payment_methods',
          value: ['cash', 'card', 'bank_transfer'],
          description: 'Available payment methods',
          descriptionAr: 'طرق الدفع المتاحة',
          type: 'array',
          category: 'payment',
          isPublic: true,
          isEditable: true,
        },
        {
          key: 'cash_on_delivery',
          value: true,
          description: 'Enable cash on delivery',
          descriptionAr: 'تفعيل الدفع عند الاستلام',
          type: 'boolean',
          category: 'payment',
          isPublic: true,
          isEditable: true,
        },
        {
          key: 'card_payments',
          value: true,
          description: 'Enable card payments',
          descriptionAr: 'تفعيل المدفوعات بالبطاقة',
          type: 'boolean',
          category: 'payment',
          isPublic: true,
          isEditable: true,
        },
        {
          key: 'bank_transfer',
          value: true,
          description: 'Enable bank transfer payments',
          descriptionAr: 'تفعيل مدفوعات التحويل المصرفي',
          type: 'boolean',
          category: 'payment',
          isPublic: true,
          isEditable: true,
        },
      ];

      const createdSettings = await this.settingsModel.insertMany(settings);

      console.log('✅ Settings seeded successfully!');
      console.log('📋 Created Settings:');
      console.log(`   🏢 Business: ${createdSettings.filter(s => s.category === 'business').length}`);
      console.log(`   📧 Email: ${createdSettings.filter(s => s.category === 'email').length}`);
      console.log(`   🔔 Notification: ${createdSettings.filter(s => s.category === 'notification').length}`);
      console.log(`   ⚙️  System: ${createdSettings.filter(s => s.category === 'system').length}`);
      console.log(`   💳 Payment: ${createdSettings.filter(s => s.category === 'payment').length}`);

      return createdSettings;
    } catch (error) {
      console.error('❌ Error seeding settings:', error);
      throw error;
    }
  }

  async clear() {
    try {
      console.log('🧹 Clearing settings...');
      await this.settingsModel.deleteMany({});
      console.log('✅ Settings cleared successfully!');
    } catch (error) {
      console.error('❌ Error clearing settings:', error);
      throw error;
    }
  }
}
