import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto, RefreshTokenDto, SendOtpDto } from './dto';
import { UserRole } from 'src/common/enums';
import { JwtPayload } from 'src/common/interfaces';
import { BranchesService } from 'src/branches/branches.service';
import { OtpService } from './otp.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private branchesService: BranchesService,
        private otpService: OtpService,
    ) { }

    // Validate user credentials (phone/password)
    async validateUser(phoneNumber: string, password: string): Promise<any> {
        const normalizedPhone = this.otpService.normalizePhoneNumber(phoneNumber);
        const user = await this.usersService.findByPhoneNumber(normalizedPhone);

        if (!user || !user.isActive) {
            return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return null;
        }

        // Update last login
        await this.usersService.updateLastLogin(user._id.toString());

        const { password: _, ...result } = user;
        return result;
    }

    // Login user (phone + password)
    async login(loginDto: LoginDto) {
        const user = await this.validateUser(loginDto.phoneNumber, loginDto.password);

        if (!user) {
            throw new UnauthorizedException('بيانات الدخول غير صحيحة');
        }
        if (loginDto.fcmToken) {
            await this.usersService.update(user._id.toString(), { fcmToken: loginDto.fcmToken });
        }
        const defaultBranch = await this.branchesService.getDefaultBranch();

        if (!defaultBranch) {
            throw new NotFoundException('الفرع الرئيسي غير موجود');
        }
        const payload: JwtPayload = {
            sub: user._id.toString(),
            phoneNumber: user.phoneNumber,
            role: user.role,
            branchId: user.branchId?.toString(),
            selectedBranchId: defaultBranch?._id.toString(),
            selectedBranchObject: defaultBranch,
        };

        const accessToken = this.jwtService.sign(payload);
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
        });

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            user: {
                _id: user._id.toString(),
                firstName: user.firstName,
                lastName: user.lastName,
                fullName: user.fullName,
                phoneNumber: user.phoneNumber,
                selectedBranchObject: defaultBranch,
                role: user.role,
                branchId: user.branchId?.toString(),
                selectedBranchId: defaultBranch?._id.toString(),
            },
        };
    }


    // generate a new token when i  select branch 
    async selectBranch(userId: string, branchId: string) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new NotFoundException('مستخدم غير موجود');
        }

        const selectedBranchId = await this.branchesService.findById(branchId);

        // 🎯 حول ObjectId إلى string
        await this.usersService.update(userId, {
            branchId: selectedBranchId._id.toString()
        });

        // اجلب المستخدم المحدث
        const updatedUser = await this.usersService.findById(userId);

        const payload: JwtPayload = {
            sub: updatedUser._id.toString(),
            phoneNumber: updatedUser.phoneNumber,
            role: updatedUser.role,
            branchId: updatedUser.branchId?.toString(),
            selectedBranchId: selectedBranchId._id.toString(),
            selectedBranchObject: selectedBranchId,
        };

        const accessToken = this.jwtService.sign(payload);
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
        });

        return {
            success: true,
            message: 'تم اختيار الفرع بنجاح',
            data: {
                access_token: accessToken,
                refresh_token: refreshToken,
                user: {
                    _id: updatedUser._id.toString(),
                    firstName: updatedUser.firstName,
                    lastName: updatedUser.lastName,
                    fullName: updatedUser.fullName,
                    phoneNumber: updatedUser.phoneNumber,
                    role: updatedUser.role,
                    branchId: updatedUser.branchId?.toString(),
                    selectedBranchId: selectedBranchId._id.toString(),
                    selectedBranchObject: selectedBranchId,
                },
            },
        };
    }
    // Register new user (requires OTP verification)
    async register(registerDto: RegisterDto) {
        // Check if user already exists
        if (registerDto.email) {
            const existingUser = await this.usersService.findByEmail(registerDto.email);
            if (existingUser) {
                throw new ConflictException('مستخدم بهذا البريد الإلكتروني موجود مسبقاً');
            }
        }

        // Verify OTP
        const normalizedPhone = this.otpService.normalizePhoneNumber(registerDto.phoneNumber);
        const isOtpValid = this.otpService.verifyOtp(normalizedPhone, registerDto.otp);
        if (!isOtpValid) {
            throw new UnauthorizedException('رمز التحقق غير صحيح أو منتهي الصلاحية');
        }

        // Create new user with customer role
        const user = await this.usersService.create({
            ...registerDto,
            phoneNumber: normalizedPhone,
            role: UserRole.CUSTOMER,
            isActive: true,
        });

        const selectedBranchId = await this.branchesService.findById(registerDto.branchId);
        // Generate tokens
        const payload: JwtPayload = {
            sub: user._id.toString(),
            phoneNumber: user.phoneNumber,
            role: user.role,
            branchId: user.branchId?.toString(),
            selectedBranchId: user.branchId?.toString(),
            selectedBranchObject: selectedBranchId,
        };

        const accessToken = this.jwtService.sign(payload);
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
        });

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            user: {
                _id: user._id.toString(),
                firstName: user.firstName,
                lastName: user.lastName,
                fullName: user.fullName,
                phoneNumber: user.phoneNumber,
                role: user.role,
            },
        };
    }

    // Refresh access token
    async refreshToken(refreshTokenDto: RefreshTokenDto) {
        try {
            const decoded = this.jwtService.verify(refreshTokenDto.refresh_token, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            });

            const user = await this.usersService.findById(decoded.sub);
            if (!user || !user.isActive) {
                throw new UnauthorizedException('مستخدم غير صالح');
            }

            const payload: JwtPayload = {
                sub: user._id.toString(),
                phoneNumber: user.phoneNumber,
                role: user.role,
                branchId: user.branchId?.toString(),
            };

            const accessToken = this.jwtService.sign(payload);

            return { access_token: accessToken };
        } catch (error) {
            throw new UnauthorizedException('رمز التحديث غير صالح');
        }
    }

    // Get current user profile
    async getProfile(userId: string) {
        return await this.usersService.findById(userId);
    }

    // Send OTP to phone number
    async sendOtp(sendOtpDto: SendOtpDto) {
        const { phoneNumber } = sendOtpDto;

        // Normalize phone number
        const normalizedPhone = this.otpService.normalizePhoneNumber(phoneNumber);

        // Validate phone number
        if (!this.otpService.validatePhoneNumber(normalizedPhone)) {
            throw new BadRequestException('رقم الهاتف غير صحيح');
        }

        // Generate OTP
        const otp = this.otpService.generateOtp();

        // Send OTP via external service
        const result = await this.otpService.sendOtp(normalizedPhone, otp);

        // In a real application, you would store the OTP in a cache/database
        // with expiration time (e.g., Redis with 5 minutes TTL)
        // For now, we'll just return success

        return {
            success: true,
            message: result.message,
            // In development, you might want to return the OTP for testing
            // otp: otp // Remove this in production
        };
    }

    // (OTP login removed; OTP used only during registration)
}