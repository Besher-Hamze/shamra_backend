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
import { OrdersService } from './orders.service';
import {
    CreateOrderDto,
    UpdateOrderDto,
    OrderQueryDto,
    UpdateOrderStatusDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from 'src/auth/gurads';
import { UserRole } from 'src/common/enums';
import { Roles } from 'src/auth/decorators/role.decorator';
import { GetUserId, GetUserRole } from 'src/common/decorators';
import { User } from 'src/users/scheme/user.scheme';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    @UseGuards(RolesGuard)
    @Roles(UserRole.CUSTOMER, UserRole.MERCHANT)
    async create(
        @Body() createOrderDto: CreateOrderDto,
        @GetUserId() userId: string,
    ) {
        const order = await this.ordersService.create(
            createOrderDto,
            userId,
        );
        return {
            success: true,
            message: 'تم إنشاء الطلب بنجاح',
            data: order,
        };
    }

    @Get()
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
    async findAll(@Query() query: OrderQueryDto) {
        const result = await this.ordersService.findAll(query);
        return {
            success: true,
            message: 'تم جلب الطلبات بنجاح',
            data: result.data,
            pagination: result.pagination,
        };
    }

    @Get('recent')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE, UserRole.MERCHANT)
    async getRecentOrders(@Query('limit') limit?: string) {
        const orders = await this.ordersService.getRecentOrders(
            limit ? parseInt(limit) : 10,
        );
        return {
            success: true,
            message: 'تم جلب الطلبات الأخيرة بنجاح',
            data: orders,
        };
    }

    @Get('stats')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async getOrderStats() {
        const stats = await this.ordersService.getOrderStats();
        return {
            success: true,
            message: 'تم جلب إحصائيات الطلبات بنجاح',
            data: stats,
        };
    }

    @Get('number/:orderNumber')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
    async findByOrderNumber(@Param('orderNumber') orderNumber: string) {
        const order = await this.ordersService.findByOrderNumber(orderNumber);
        return {
            success: true,
            message: 'تم جلب الطلب بنجاح',
            data: order,
        };
    }

    @Get('by-id/:id')
    @UseGuards(RolesGuard)
    // @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE,)
    async findOne(@Param('id') id: string) {
        const order = await this.ordersService.findById(id);
        return {
            success: true,
            message: 'تم جلب الطلب بنجاح',
            data: order,
        };
    }

    @Patch(':id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async update(
        @Param('id') id: string,
        @Body() updateOrderDto: UpdateOrderDto,
        @Request() req,
    ) {
        const order = await this.ordersService.update(
            id,
            updateOrderDto,
            req.user.sub,
        );
        return {
            success: true,
            message: 'تم تحديث الطلب بنجاح',
            data: order,
        };
    }

    @Patch(':id/status')
    @UseGuards(RolesGuard)
    // @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE,UserRole.MERCHANT)
    async updateStatus(
        @Param('id') id: string,
        @Body() updateStatusDto: UpdateOrderStatusDto,
        @GetUserId() userId: string,
        @GetUserRole() userRole: UserRole,
    ) {
        const order = await this.ordersService.updateStatus(
            id,
            updateStatusDto,
            userId,
            userRole,
        );
        return {
            success: true,
            message: 'تم تحديث حالة الطلب بنجاح',
            data: order,
        };
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @HttpCode(HttpStatus.OK)
    async remove(@Param('id') id: string, @Request() req) {
        await this.ordersService.remove(id, req.user.sub);
        return {
            success: true,
            message: 'تم حذف الطلب بنجاح',
        };
    }
    @Get('my')
    @UseGuards(RolesGuard)
    @Roles(UserRole.CUSTOMER, UserRole.MERCHANT)
    async getMyOrders(@GetUserId() userId: string) {
        const orders = await this.ordersService.getMyOrders(userId);
        return {
            success: true,
            message: 'تم جلب طلباتك بنجاح',
            data: orders,
        };
    }
}