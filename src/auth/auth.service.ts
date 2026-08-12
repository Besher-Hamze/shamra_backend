import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
import { UserRole } from 'src/common/enums';
import { JwtPayload } from 'src/common/interfaces';
import { BranchesService } from 'src/branches/branches.service';
import { normalizePhoneNumber } from './phone.util';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private branchesService: BranchesService,
    ) { }

    // Validate user credentials (phone/password)
    async validateUser(phoneNumber: string, password: string): Promise<any> {
        const normalizedPhone = normalizePhoneNumber(phoneNumber);
        const user = await this.usersService.findByPhoneNumber(normalizedPhone);

        if (!user || !user.isActive) {
            return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return null;
        }

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
        const selectedBranch = await this.branchesService.findById(user.branchId?.toString());
        const payload: JwtPayload = {
            sub: user._id.toString(),
            phoneNumber: user.phoneNumber,
            role: user.role,
            branchId: user.branchId?.toString(),
            selectedBranchId: user.branchId?.toString(),
            selectedBranchObject: selectedBranch,
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
                selectedBranchId: user.branchId?.toString(),
            },
        };
    }

    async selectBranch(userId: string, branchId: string) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new NotFoundException('مستخدم غير موجود');
        }

        const selectedBranchId = await this.branchesService.findById(branchId);

        await this.usersService.update(userId, {
            branchId: selectedBranchId._id.toString()
        });

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

    async register(registerDto: RegisterDto) {
        const normalizedPhone = normalizePhoneNumber(registerDto.phoneNumber);

        const existing = await this.usersService.findByPhoneNumber(normalizedPhone);
        if (existing) {
            throw new ConflictException('رقم الهاتف مستخدم مسبقًا');
        }

        const user = await this.usersService.create({
            ...registerDto,
            phoneNumber: normalizedPhone,
            role: UserRole.CUSTOMER,
            isActive: true,
        });

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

    async getProfile(userId: string) {
        return await this.usersService.findById(userId);
    }

    async forgotPassword(dto: ForgotPasswordDto) {
        const normalizedPhone = normalizePhoneNumber(dto.phoneNumber);
        const user = await this.usersService.findByPhoneNumber(normalizedPhone);
        if (!user) {
            return { success: true, message: 'تم قبول الطلب إن وجد الحساب' };
        }
        return { success: true, message: 'يمكنك الآن إعادة تعيين كلمة المرور' };
    }

    async resetPassword(dto: ResetPasswordDto) {
        const normalizedPhone = normalizePhoneNumber(dto.phoneNumber);
        const user = await this.usersService.findByPhoneNumber(normalizedPhone);
        if (!user) {
            throw new NotFoundException('مستخدم غير موجود');
        }
        await this.usersService.setPasswordById(user._id.toString(), dto.newPassword);
        return { success: true, message: 'تم إعادة تعيين كلمة المرور بنجاح' };
    }
}
