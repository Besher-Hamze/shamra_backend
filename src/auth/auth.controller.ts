import {
    Controller,
    Post,
    Body,
    UseGuards,
    Request,
    Get,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard, LocalAuthGuard } from './gurads';
import { LoginDto, RefreshTokenDto, RegisterDto } from './dto';
import { GetUserId } from 'src/common/decorators';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @UseGuards(LocalAuthGuard)
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto) {
        const result = await this.authService.login(loginDto);
        return {
            success: true,
            message: 'تم تسجيل الدخول بنجاح',
            data: result,
        };
    }

    @Post('select-branch')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async selectBranch(@GetUserId() userId: string, @Body("branchId") branchId: string) {
        const result = await this.authService.selectBranch(userId, branchId);
        return result;
    }

    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        const result = await this.authService.register(registerDto);
        return {
            success: true,
            message: 'تم إنشاء الحساب بنجاح',
            data: result,
        };
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
        const result = await this.authService.refreshToken(refreshTokenDto);
        return {
            success: true,
            message: 'تم تحديث الرمز المميز بنجاح',
            data: result,
        };
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    async getProfile(@Request() req) {
        const user = await this.authService.getProfile(req.user.sub);
        return {
            success: true,
            message: 'تم جلب الملف الشخصي بنجاح',
            data: user,
        };
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async logout() {
        return {
            success: true,
            message: 'تم تسجيل الخروج بنجاح',
        };
    }
}