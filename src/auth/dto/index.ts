import { IsEmail, IsOptional, IsString, MinLength, MaxLength, Matches } from 'class-validator';

const PHONE_INPUT_PATTERN = /^[\d+\s().-]+$/;

// Login DTO (phone + password)
export class LoginDto {
    @IsString()
    @MinLength(8, { message: 'رقم الهاتف غير صحيح' })
    @MaxLength(24, { message: 'رقم الهاتف غير صحيح' })
    @Matches(PHONE_INPUT_PATTERN, { message: 'رقم الهاتف غير صحيح' })
    phoneNumber: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsOptional()
    @IsString()
    fcmToken?: string;
}

// Forgot Password DTO
export class ForgotPasswordDto {
    @IsString()
    @MinLength(8, { message: 'رقم الهاتف غير صحيح' })
    @MaxLength(24, { message: 'رقم الهاتف غير صحيح' })
    @Matches(PHONE_INPUT_PATTERN, { message: 'رقم الهاتف غير صحيح' })
    phoneNumber: string;
}

// Reset Password DTO (phone + new password, no OTP)
export class ResetPasswordDto {
    @IsString()
    @MinLength(8, { message: 'رقم الهاتف غير صحيح' })
    @MaxLength(24, { message: 'رقم الهاتف غير صحيح' })
    @Matches(PHONE_INPUT_PATTERN, { message: 'رقم الهاتف غير صحيح' })
    phoneNumber: string;

    @IsString()
    @MinLength(6)
    newPassword: string;
}

// Register DTO
export class RegisterDto {
    @IsString()
    @MinLength(2)
    firstName: string;

    @IsString()
    @MinLength(2)
    lastName: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    @MinLength(8, { message: 'رقم الهاتف غير صحيح' })
    @MaxLength(24, { message: 'رقم الهاتف غير صحيح' })
    @Matches(PHONE_INPUT_PATTERN, { message: 'رقم الهاتف غير صحيح' })
    phoneNumber: string;

    @IsOptional()
    @IsString()
    fcmToken?: string;

    @IsOptional()
    @IsString()
    branchId?: string;
}

// Refresh Token DTO
export class RefreshTokenDto {
    @IsString()
    refresh_token: string;
}
