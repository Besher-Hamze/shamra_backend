import { Controller, Post, Delete, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { MainSeedService } from './main.seed';
import { JwtAuthGuard } from '../common/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/gurads';
import { Roles } from '../auth/decorators/role.decorator';
import { UserRole } from '../common/enums';

@Controller('seeds')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SeedsController {
    constructor(private readonly mainSeedService: MainSeedService) { }

    @Post('seed')
    @HttpCode(HttpStatus.OK)
    @Roles(UserRole.ADMIN)
    async seedAll() {
        return await this.mainSeedService.seedAll();
    }

    @Delete('clear')
    @HttpCode(HttpStatus.OK)
    @Roles(UserRole.ADMIN)
    async clearAll() {
        return await this.mainSeedService.clearAll();
    }

    @Post('reset')
    @HttpCode(HttpStatus.OK)
    @Roles(UserRole.ADMIN)
    async reset() {
        return await this.mainSeedService.reset();
    }
}
