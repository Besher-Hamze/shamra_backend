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
import { MerchantsService } from './merchants.service';
import {
    CreateMerchantRequestDto,
    UpdateMerchantRequestDto,
    MerchantQueryDto,
    ReviewMerchantDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from 'src/auth/gurads';
import { UserRole } from 'src/common/enums';
import { Roles } from 'src/auth/decorators/role.decorator';

@Controller('merchants')
@UseGuards(JwtAuthGuard)
export class MerchantsController {
    constructor(private readonly merchantsService: MerchantsService) { }

    // Create merchant request (any authenticated user)
    @Post('request')
    async createRequest(
        @Body() createMerchantRequestDto: CreateMerchantRequestDto,
        @Request() req,
    ) {
        const merchant = await this.merchantsService.createRequest(
            createMerchantRequestDto,
            req.user.sub,
        );
        return {
            success: true,
            message: 'تم إرسال طلب التاجر بنجاح',
            data: merchant,
        };
    }

    // Get all merchant requests (admin/manager only)
    @Get()
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async findAll(@Query() query: MerchantQueryDto) {
        const result = await this.merchantsService.findAll(query);
        return {
            success: true,
            message: 'تم جلب طلبات التجار بنجاح',
            data: result.data,
            pagination: result.pagination,
        };
    }

    // Get merchant statistics (admin/manager only)
    @Get('statistics')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async getStatistics() {
        const statistics = await this.merchantsService.getStatistics();
        return {
            success: true,
            message: 'تم جلب إحصائيات التجار بنجاح',
            data: statistics,
        };
    }

    // Get my merchant request (any authenticated user)
    @Get('my-request')
    async getMyRequest(@Request() req) {
        const merchant = await this.merchantsService.findByUserId(req.user.sub);
        return {
            success: true,
            message: 'تم جلب طلب التاجر بنجاح',
            data: merchant,
        };
    }

    // Get merchant request by ID (admin/manager only)
    @Get(':id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async findOne(@Param('id') id: string) {
        const merchant = await this.merchantsService.findById(id);
        return {
            success: true,
            message: 'تم جلب طلب التاجر بنجاح',
            data: merchant,
        };
    }

    // Update my merchant request (only if pending)
    @Patch('my-request')
    async updateMyRequest(
        @Request() req,
        @Body() updateMerchantRequestDto: UpdateMerchantRequestDto,
    ) {
        const merchant = await this.merchantsService.findByUserId(req.user.sub);

        if (!merchant) {
            return {
                success: false,
                message: 'لم يتم العثور على طلب تاجر',
            };
        }

        const updatedMerchant = await this.merchantsService.updateRequest(
            merchant._id.toString(),
            updateMerchantRequestDto,
        );

        return {
            success: true,
            message: 'تم تحديث طلب التاجر بنجاح',
            data: updatedMerchant,
        };
    }

    // Review merchant request (approve/reject) - admin only
    @Patch(':id/review')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async reviewRequest(
        @Param('id') id: string,
        @Body() reviewMerchantDto: ReviewMerchantDto,
        @Request() req,
    ) {
        const merchant = await this.merchantsService.reviewRequest(
            id,
            reviewMerchantDto,
            req.user.sub,
        );

        const message = reviewMerchantDto.status === 'approved'
            ? 'تم الموافقة على طلب التاجر بنجاح'
            : 'تم رفض طلب التاجر';

        return {
            success: true,
            message,
            data: merchant,
        };
    }

    // Delete merchant request (admin only)
    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    async remove(@Param('id') id: string) {
        await this.merchantsService.remove(id);
        return {
            success: true,
            message: 'تم حذف طلب التاجر بنجاح',
        };
    }
}
