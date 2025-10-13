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
import { BranchesService } from './branches.service';
import {
    CreateBranchDto,
    UpdateBranchDto,
    BranchQueryDto,
    UpdateSortOrderDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from 'src/auth/gurads';
import { Roles } from 'src/auth/decorators/role.decorator';
import { UserRole } from 'src/common/enums';

@Controller('branches')
export class BranchesController {
    constructor(private readonly branchesService: BranchesService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async create(
        @Body() createBranchDto: CreateBranchDto,
        @Request() req,
    ) {
        const branch = await this.branchesService.create(
            createBranchDto,
            req.user.sub,
        );
        return {
            success: true,
            message: 'تم إنشاء الفرع بنجاح',
            data: branch,
        };
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async findAll(@Query() query: BranchQueryDto) {
        const result = await this.branchesService.findAll(query);
        return {
            success: true,
            message: 'تم جلب الفروع بنجاح',
            data: result.data,
            pagination: result.pagination,
        };
    }

    @Get('active')
    async getActiveBranches() {
        const branches = await this.branchesService.getActiveBranches();
        return {
            success: true,
            message: 'تم جلب الفروع النشطة بنجاح',
            data: branches,
        };
    }

    @Get('main')
    @UseGuards(JwtAuthGuard)
    async getMainBranch() {
        const branch = await this.branchesService.getMainBranch();
        return {
            success: true,
            message: 'تم جلب الفرع الرئيسي بنجاح',
            data: branch,
        };
    }

    @Get('stats')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async getBranchStats() {
        const stats = await this.branchesService.getBranchStats();
        return {
            success: true,
            message: 'تم جلب إحصائيات الفروع بنجاح',
            data: stats,
        };
    }

    @Get('code/:code')
    @UseGuards(JwtAuthGuard)
    async findByCode(@Param('code') code: string) {
        const branch = await this.branchesService.findByCode(code);
        return {
            success: true,
            message: 'تم جلب الفرع بنجاح',
            data: branch,
        };
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async findOne(@Param('id') id: string) {
        const branch = await this.branchesService.findById(id);
        return {
            success: true,
            message: 'تم جلب الفرع بنجاح',
            data: branch,
        };
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async update(
        @Param('id') id: string,
        @Body() updateBranchDto: UpdateBranchDto,
        @Request() req,
    ) {
        const branch = await this.branchesService.update(
            id,
            updateBranchDto,
            req.user.sub,
        );
        return {
            success: true,
            message: 'تم تحديث الفرع بنجاح',
            data: branch,
        };
    }

    @Patch(':id/toggle-active')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async toggleActive(@Param('id') id: string, @Request() req) {
        const branch = await this.branchesService.toggleActive(id, req.user.sub);
        return {
            success: true,
            message: 'تم تحديث حالة الفرع بنجاح',
            data: branch,
        };
    }

    @Patch(':id/sort-order')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async updateSortOrder(
        @Param('id') id: string,
        @Body() updateSortOrderDto: UpdateSortOrderDto,
        @Request() req,
    ) {
        const branch = await this.branchesService.updateSortOrder(
            id,
            updateSortOrderDto.sortOrder,
            req.user.sub,
        );
        return {
            success: true,
            message: 'تم تحديث ترتيب الفرع بنجاح',
            data: branch,
        };
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    async remove(@Param('id') id: string, @Request() req) {
        await this.branchesService.remove(id, req.user.sub);
        return {
            success: true,
            message: 'تم حذف الفرع بنجاح',
        };
    }
}