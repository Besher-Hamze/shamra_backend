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
import { LoginDto, RegisterDto, RefreshTokenDto } from './dto';
import { UserRole } from 'src/common/enums';
import { JwtPayload } from 'src/common/interfaces';
import { BranchesService } from 'src/branches/branches.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private branchesService: BranchesService,
    ) { }

    // Validate user credentials
    async validateUser(email: string, password: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);

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

    // Login user
    async login(loginDto: LoginDto) {
        const user = await this.validateUser(loginDto.email, loginDto.password);

        if (!user) {
            throw new UnauthorizedException('بيانات الدخول غير صحيحة');
        }
        const defaultBranch = await this.branchesService.getDefaultBranch();

        if (!defaultBranch) {
            throw new NotFoundException('الفرع الرئيسي غير موجود');
        }
        const payload: JwtPayload = {
            sub: user._id.toString(),
            email: user.email,
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
                email: user.email,
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
        email: updatedUser.email,
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
                email: updatedUser.email,
                role: updatedUser.role,
                branchId: updatedUser.branchId?.toString(),
                selectedBranchId: selectedBranchId._id.toString(),
                selectedBranchObject: selectedBranchId,
            },
        },
    };
}
    // Register new user
    async register(registerDto: RegisterDto) {
        // Check if user already exists
        const existingUser = await this.usersService.findByEmail(registerDto.email);
        if (existingUser) {
            throw new ConflictException('مستخدم بهذا البريد الإلكتروني موجود مسبقاً');
        }

        // Create new user with customer role
        const user = await this.usersService.create({
            ...registerDto,
            role: UserRole.CUSTOMER,
            isActive: true,
        });

        // Generate tokens
        const payload: JwtPayload = {
            sub: user._id.toString(),
            email: user.email,
            role: user.role,
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
                email: user.email,
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
                email: user.email,
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
}