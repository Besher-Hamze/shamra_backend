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
import { LoginDto, RefreshTokenDto, RegisterDto, SendOtpDto } from './dto';
import { GetSelectedBranchObject, GetUserId } from 'src/common/decorators';
import { Branch } from 'src/branches/scheme/branche.scheme';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
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
    async getProfile(@GetUserId() userId: string, @GetSelectedBranchObject() selectedBranchObject: Branch) {
        const user = await this.authService.getProfile(userId);

        return {
            success: true,
            message: 'تم جلب الملف الشخصي بنجاح',
            data: {
                ...user,
                selectedBranchObject: selectedBranchObject
            },
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

    @Post('send-otp')
    @HttpCode(HttpStatus.OK)
    async sendOtp(@Body() sendOtpDto: SendOtpDto) {
        const result = await this.authService.sendOtp(sendOtpDto);
        return {
            success: true,
            message: result.message,
            data: result,
        };
    }

    // OTP login endpoints removed; OTP is only for registration now
}