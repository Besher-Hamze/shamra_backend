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
import { CustomersService } from './customers.service';
import {
    CreateCustomerDto,
    UpdateCustomerDto,
    CustomerQueryDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from 'src/auth/gurads';
import { UserRole } from 'src/common/enums';
import { Roles } from 'src/auth/decorators/role.decorator';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
    constructor(private readonly customersService: CustomersService) { }

    @Post()
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
    async create(
        @Body() createCustomerDto: CreateCustomerDto,
        @Request() req,
    ) {
        const customer = await this.customersService.create(
            createCustomerDto,
            req.user.sub,
        );
        return {
            success: true,
            message: 'تم إنشاء العميل بنجاح',
            data: customer,
        };
    }

    @Get()
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
    async findAll(@Query() query: CustomerQueryDto) {
        const result = await this.customersService.findAll(query);
        return {
            success: true,
            message: 'تم جلب العملاء بنجاح',
            data: result.data,
            pagination: result.pagination,
        };
    }

    @Get('top-customers')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async getTopCustomers(@Query('limit') limit?: string) {
        const customers = await this.customersService.getTopCustomers(
            limit ? parseInt(limit) : 10,
        );
        return {
            success: true,
            message: 'تم جلب أفضل العملاء بنجاح',
            data: customers,
        };
    }

    @Get('recent')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
    async getRecentCustomers(@Query('limit') limit?: string) {
        const customers = await this.customersService.getRecentCustomers(
            limit ? parseInt(limit) : 10,
        );
        return {
            success: true,
            message: 'تم جلب العملاء الجدد بنجاح',
            data: customers,
        };
    }

    @Get('stats')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async getCustomerStats() {
        const stats = await this.customersService.getCustomerStats();
        return {
            success: true,
            message: 'تم جلب إحصائيات العملاء بنجاح',
            data: stats,
        };
    }

    @Get('email/:email')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
    async findByEmail(@Param('email') email: string) {
        const customer = await this.customersService.findByEmail(email);
        return {
            success: true,
            message: 'تم جلب العميل بنجاح',
            data: customer,
        };
    }

    @Get('code/:customerCode')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
    async findByCustomerCode(@Param('customerCode') customerCode: string) {
        const customer = await this.customersService.findByCustomerCode(customerCode);
        return {
            success: true,
            message: 'تم جلب العميل بنجاح',
            data: customer,
        };
    }

    @Get(':id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
    async findOne(@Param('id') id: string) {
        const customer = await this.customersService.findById(id);
        return {
            success: true,
            message: 'تم جلب العميل بنجاح',
            data: customer,
        };
    }

    @Patch(':id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
    async update(
        @Param('id') id: string,
        @Body() updateCustomerDto: UpdateCustomerDto,
        @Request() req,
    ) {
        const customer = await this.customersService.update(
            id,
            updateCustomerDto,
            req.user.sub,
        );
        return {
            success: true,
            message: 'تم تحديث العميل بنجاح',
            data: customer,
        };
    }

    @Patch(':id/toggle-active')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async toggleActive(@Param('id') id: string, @Request() req) {
        const customer = await this.customersService.toggleActive(id, req.user.sub);
        return {
            success: true,
            message: 'تم تحديث حالة العميل بنجاح',
            data: customer,
        };
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @HttpCode(HttpStatus.OK)
    async remove(@Param('id') id: string, @Request() req) {
        await this.customersService.remove(id, req.user.sub);
        return {
            success: true,
            message: 'تم حذف العميل بنجاح',
        };
    }
}