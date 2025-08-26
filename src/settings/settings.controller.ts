import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import {
    CreateSettingDto,
    UpdateSettingDto,
    SettingsQueryDto,
    BulkUpdateSettingsDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from 'src/auth/gurads';
import { Roles } from 'src/auth/decorators/role.decorator';
import { UserRole } from 'src/common/enums';

@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    @Get('public')
    async getPublicSettings() {
        const settings = await this.settingsService.getPublicSettings();
        return {
            success: true,
            message: 'تم جلب الإعدادات العامة بنجاح',
            data: settings,
        };
    }

    @Get('value/:key')
    async getSettingValue(
        @Param('key') key: string,
        @Query('default') defaultValue?: string,
    ) {
        const value = await this.settingsService.getValue(key, defaultValue);
        return {
            success: true,
            message: 'تم جلب قيمة الإعداد بنجاح',
            data: { key, value },
        };
    }

    @Get('values')
    async getMultipleValues(@Query('keys') keys: string) {
        const keyArray = keys.split(',').map(k => k.trim());
        const values = await this.settingsService.getMultipleValues(keyArray);
        return {
            success: true,
            message: 'تم جلب قيم الإعدادات بنجاح',
            data: values,
        };
    }

    @Get('category/:category')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async getSettingsByCategory(@Param('category') category: string) {
        const settings = await this.settingsService.getSettingsByCategory(category);
        return {
            success: true,
            message: `تم جلب إعدادات الفئة ${category} بنجاح`,
            data: settings,
        };
    }

    @Get('cache/stats')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async getCacheStats() {
        const stats = await this.settingsService.getCacheStats();
        return {
            success: true,
            message: 'تم جلب إحصائيات التخزين المؤقت بنجاح',
            data: stats,
        };
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async create(
        @Body() createSettingDto: CreateSettingDto,
        @Request() req,
    ) {
        const setting = await this.settingsService.create(
            createSettingDto,
            req.user.sub,
        );
        return {
            success: true,
            message: 'تم إنشاء الإعداد بنجاح',
            data: setting,
        };
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async findAll(@Query() query: SettingsQueryDto) {
        const result = await this.settingsService.findAll(query);
        return {
            success: true,
            message: 'تم جلب الإعدادات بنجاح',
            data: result.data,
            pagination: result.pagination,
        };
    }

    @Get(':key')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async findOne(@Param('key') key: string) {
        const setting = await this.settingsService.findOne(key);
        return {
            success: true,
            message: 'تم جلب الإعداد بنجاح',
            data: setting,
        };
    }

    @Patch(':key')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async update(
        @Param('key') key: string,
        @Body() updateSettingDto: UpdateSettingDto,
        @Request() req,
    ) {
        const setting = await this.settingsService.update(
            key,
            updateSettingDto,
            req.user.sub,
        );
        return {
            success: true,
            message: 'تم تحديث الإعداد بنجاح',
            data: setting,
        };
    }

    @Post('bulk-update')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async bulkUpdate(
        @Body() bulkUpdateSettingsDto: BulkUpdateSettingsDto,
        @Request() req,
    ) {
        const settings = await this.settingsService.bulkUpdate(
            bulkUpdateSettingsDto,
            req.user.sub,
        );
        return {
            success: true,
            message: `تم تحديث ${settings.length} إعداد بنجاح`,
            data: settings,
        };
    }

    @Patch(':key/reset')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async resetToDefault(@Param('key') key: string, @Request() req) {
        const setting = await this.settingsService.resetToDefault(key, req.user.sub);
        return {
            success: true,
            message: 'تم إعادة تعيين الإعداد للقيمة الافتراضية بنجاح',
            data: setting,
        };
    }

    @Delete(':key')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    async remove(@Param('key') key: string, @Request() req) {
        await this.settingsService.remove(key, req.user.sub);
        return {
            success: true,
            message: 'تم حذف الإعداد بنجاح',
        };
    }

    @Post('cache/clear')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    async clearCache() {
        await this.settingsService.clearCache();
        return {
            success: true,
            message: 'تم مسح التخزين المؤقت بنجاح',
        };
    }
}
