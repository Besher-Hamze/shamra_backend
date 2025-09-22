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
import { UsersService } from './users.service';
import {
    CreateUserDto,
    UpdateUserDto,
    ChangePasswordDto,
    UserQueryDto,
    ChangeRoleDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from 'src/auth/gurads';
import { UserRole } from 'src/common/enums';
import { Roles } from 'src/auth/decorators/role.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async create(@Body() createUserDto: CreateUserDto) {
        const user = await this.usersService.create(createUserDto);
        return {
            success: true,
            message: 'تم إنشاء المستخدم بنجاح',
            data: user,
        };
    }

    @Get()
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async findAll(@Query() query: UserQueryDto) {
        const result = await this.usersService.findAll(query);
        return {
            success: true,
            message: 'تم جلب المستخدمين بنجاح',
            data: result.data,
            pagination: result.pagination,
        };
    }

    @Get('profile')
    async getProfile(@Request() req) {
        const user = await this.usersService.findById(req.user.sub);
        return {
            success: true,
            message: 'تم جلب الملف الشخصي بنجاح',
            data: user,
        };
    }

    @Get(':id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async findOne(@Param('id') id: string) {
        const user = await this.usersService.findById(id);
        return {
            success: true,
            message: 'تم جلب المستخدم بنجاح',
            data: user,
        };
    }

    @Patch('profile')
    async updateProfile(
        @Request() req,
        @Body() updateUserDto: UpdateUserDto,
    ) {
        const user = await this.usersService.update(req.user.sub, updateUserDto);
        return {
            success: true,
            message: 'تم تحديث الملف الشخصي بنجاح',
            data: user,
        };
    }

    @Patch('change-password')
    @HttpCode(HttpStatus.OK)
    async changePassword(
        @Request() req,
        @Body() changePasswordDto: ChangePasswordDto,
    ) {
        await this.usersService.changePassword(req.user.sub, changePasswordDto);
        return {
            success: true,
            message: 'تم تغيير كلمة المرور بنجاح',
        };
    }

    @Patch(':id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        const user = await this.usersService.update(id, updateUserDto);
        return {
            success: true,
            message: 'تم تحديث المستخدم بنجاح',
            data: user,
        };
    }

    @Patch(':id/toggle-active')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async toggleActive(@Param('id') id: string) {
        const user = await this.usersService.toggleActive(id);
        return {
            success: true,
            message: 'تم تحديث حالة المستخدم بنجاح',
            data: user,
        };
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    async remove(@Param('id') id: string) {
        await this.usersService.remove(id);
        return {
            success: true,
            message: 'تم حذف المستخدم بنجاح',
        };
    }

    @Patch(':id/change-role')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async changeRole(@Param('id') id: string, @Body() changeRoleDto: ChangeRoleDto) {
        const user = await this.usersService.changeRole(id, changeRoleDto.role);
        return {
            success: true,
            message: 'تم تحديث دور المستخدم بنجاح',
            data: user,
        };
    }
}

