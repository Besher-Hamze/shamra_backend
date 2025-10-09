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
import { NotificationsService } from './notifications.service';

import { JwtAuthGuard, RolesGuard } from 'src/auth/gurads';
import { UserRole } from 'src/common/enums';
import { Roles } from 'src/auth/decorators/role.decorator';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { BulkNotificationDto } from './dto/bulk-notification.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async create(
    @Body() createNotificationDto: CreateNotificationDto,
    @Request() req,
  ) {
    const notification = await this.notificationsService.create(
      createNotificationDto,
      req.user.sub,
    );
    return {
      success: true,
      message: 'تم إنشاء الإشعار بنجاح',
      data: notification,
    };
  }

  @Post('bulk')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async createBulk(
    @Body() bulkNotificationDto: BulkNotificationDto,
    @Request() req,
  ) {
    const notifications = await this.notificationsService.createBulk(
      bulkNotificationDto,
      req.user.sub,
    );
    return {
      success: true,
      message: `تم إنشاء ${notifications.length} إشعار بنجاح`,
      data: notifications,
    };
  }

  // ✅ NEW ENDPOINT: Broadcast notification to all users
  @Post('broadcast')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async notifyAll(
    @Body('title') title: string,
    @Body('message') message: string,
    @Body('data') data?: Record<string, string>,
  ) {
    const result = await this.notificationsService.notifyAll(title, message, data);
    return {
      success: true,
      message: 'تم إرسال الإشعار إلى جميع المستخدمين',
      data: result,
    };
  }

  @Get()
  async findAll(@Query() query: NotificationQueryDto, @Request() req) {
    const result = await this.notificationsService.findAll(query, req.user.sub);
    return {
      success: true,
      message: 'تم جلب الإشعارات بنجاح',
      data: result.data,
      pagination: result.pagination,
    };
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getNotificationStats(@Query('recipientId') recipientId?: string) {
    const stats = await this.notificationsService.getNotificationStats(recipientId);
    return {
      success: true,
      message: 'تم جلب إحصائيات الإشعارات بنجاح',
      data: stats,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const notification = await this.notificationsService.findOne(id);
    return {
      success: true,
      message: 'تم جلب الإشعار بنجاح',
      data: notification,
    };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Param('id') id: string,
    @Body() markReadDto: MarkReadDto,
    @Request() req,
  ) {
    const notification = await this.notificationsService.markAsRead(
      { ...markReadDto, notificationId: id },
      req.user.sub,
    );
    return {
      success: true,
      message: 'تم تحديد الإشعار كمقروء بنجاح',
      data: notification,
    };
  }

  @Patch('mark-all-read')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Request() req) {
    const result = await this.notificationsService.markAllAsRead(
      req.user.sub,
      req.user.sub,
    );
    return {
      success: true,
      message: `تم تحديد ${result.modifiedCount} إشعار كمقروء بنجاح`,
      data: result,
    };
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async update(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
    @Request() req,
  ) {
    const notification = await this.notificationsService.update(
      id,
      updateNotificationDto,
      req.user.sub,
    );
    return {
      success: true,
      message: 'تم تحديث الإشعار بنجاح',
      data: notification,
    };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @Request() req) {
    await this.notificationsService.remove(id, req.user.sub);
    return {
      success: true,
      message: 'تم حذف الإشعار بنجاح',
    };
  }
}
