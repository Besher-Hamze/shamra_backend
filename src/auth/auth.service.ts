import {
    Injectable,
    UnauthorizedException,
    ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto, RefreshTokenDto } from './dto';
import { UserRole } from 'src/common/enums';
import { JwtPayload } from 'src/common/interfaces';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
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

        const payload: JwtPayload = {
            sub: user._id.toString(),
            email: user.email,
            role: user.role,
            branchId: user.branchId?.toString(),
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
                branchId: user.branchId?.toString(),
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