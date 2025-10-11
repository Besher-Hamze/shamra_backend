import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

// Login DTO
export class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsOptional()
    @IsString()
    fcmToken?: string
}

// Register DTO
export class RegisterDto {
    @IsString()
    @MinLength(2)
    firstName: string;

    @IsString()
    @MinLength(2)
    lastName: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    phoneNumber: string;

    @IsOptional()
    @IsString()
    fcmToken?: string

    @IsOptional()
    @IsString()
    branchId?: string

}

// Refresh Token DTO
export class RefreshTokenDto {
    @IsString()
    refresh_token: string;
}