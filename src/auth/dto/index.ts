import { IsEmail, IsOptional, IsString, MinLength, IsPhoneNumber, Matches,ValidateIf } from 'class-validator';

// Login DTO (phone + password)
export class LoginDto {
     @IsString() 
     @Matches(/^(\+963|0)?[0-9]{9}$/, { message: 'رقم الهاتف غير صحيح' })
      phoneNumber: string; 
      
      @IsString() 
      @MinLength(6) 
      password: string;
      
      @IsOptional()
       @IsString() 
       fcmToken?: string 
    }

// Send OTP DTO
export class SendOtpDto {
    @IsString()
    @Matches(/^(\+963|0)?[0-9]{9}$/, { message: 'رقم الهاتف غير صحيح' })
    phoneNumber: string;
}

// Verify OTP DTO (post-register verification)
export class VerifyOtpDto {
    @IsString()
    @Matches(/^(\+963|0)?[0-9]{9}$/, { message: 'رقم الهاتف غير صحيح' })
    phoneNumber: string;

    @IsString()
    @MinLength(4)
    otp: string;
}

// Forgot Password DTO (send OTP)
export class ForgotPasswordDto {
    @IsString()
    @Matches(/^(\+963|0)?[0-9]{9}$/, { message: 'رقم الهاتف غير صحيح' })
    phoneNumber: string;
}

// Reset Password DTO (verify OTP + new password)
export class ResetPasswordDto {
    @IsString()
    @Matches(/^(\+963|0)?[0-9]{9}$/, { message: 'رقم الهاتف غير صحيح' })
    phoneNumber: string;

    @IsString()
    @MinLength(4)
    otp: string;

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
    @Matches(/^(\+963|0)?[0-9]{9}$/, { message: 'رقم الهاتف غير صحيح' })
    phoneNumber: string;

    @IsOptional()
    @IsString()
    fcmToken?: string

    @IsOptional()
    @IsString()
    branchId?: string

    @IsOptional()
    @IsString()
    registrationToken?: string;
}

// Refresh Token DTO
export class RefreshTokenDto {
    @IsString()
    refresh_token: string;
}