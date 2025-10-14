import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class OtpService {
    private readonly otpApiUrl = 'https://otp.anycode-sy.com/api/send-otp';
    private readonly apiKey = 'b13e211b-9905-4715-9522-a2f257c7c358';
    private readonly phoneToOtp: Map<string, { otp: string; expiresAt: number }> = new Map();
    private readonly ttlMs = 5 * 60 * 1000; // 5 minutes

    constructor(private configService: ConfigService) { }

    async sendOtp(phoneNumber: string, otp: string): Promise<{ success: boolean; message: string }> {
        try {
            const response = await axios.post(
                this.otpApiUrl,
                {
                    phone_number: phoneNumber,
                    otp: otp
                },
                {
                    headers: {
                        'x-api-key': this.apiKey,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000 // 10 seconds timeout
                }
            );

            if (response.data && response.data.message === 'OTP SEND SUCCESSFULLY') {
                // store OTP with TTL
                this.phoneToOtp.set(phoneNumber, { otp, expiresAt: Date.now() + this.ttlMs });
                return {
                    success: true,
                    message: 'تم إرسال رمز التحقق بنجاح'
                };
            } else {
                throw new HttpException(
                    'فشل في إرسال رمز التحقق',
                    HttpStatus.BAD_REQUEST
                );
            }
        } catch (error) {
            console.error('OTP Service Error:', error);

            if (error.response) {
                // API responded with error status
                throw new HttpException(
                    'فشل في إرسال رمز التحقق - خطأ في الخدمة',
                    HttpStatus.BAD_REQUEST
                );
            } else if (error.request) {
                // Network error
                throw new HttpException(
                    'فشل في إرسال رمز التحقق - خطأ في الشبكة',
                    HttpStatus.SERVICE_UNAVAILABLE
                );
            } else {
                // Other error
                throw new HttpException(
                    'فشل في إرسال رمز التحقق',
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
        }
    }

    generateOtp(): string {
        // Generate a 6-digit OTP
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    verifyOtp(phoneNumber: string, otp: string): boolean {
        const record = this.phoneToOtp.get(phoneNumber);
        if (!record) return false;
        if (Date.now() > record.expiresAt) {
            this.phoneToOtp.delete(phoneNumber);
            return false;
        }
        const isValid = record.otp === otp;
        if (isValid) {
            this.phoneToOtp.delete(phoneNumber);
        }
        return isValid;
    }

    validatePhoneNumber(phoneNumber: string): boolean {
        // Basic phone number validation for Syrian numbers
        // Remove any non-digit characters
        const cleaned = phoneNumber.replace(/\D/g, '');

        // Check if it's a valid Syrian phone number format
        // Syrian numbers can start with +963, 963, or 0
        if (cleaned.startsWith('963')) {
            return cleaned.length === 12; // +963xxxxxxxxx
        } else if (cleaned.startsWith('0')) {
            return cleaned.length === 10; // 0xxxxxxxxx
        }

        return false;
    }

    normalizePhoneNumber(phoneNumber: string): string {
        // Normalize phone number to international format
        const cleaned = phoneNumber.replace(/\D/g, '');

        if (cleaned.startsWith('963')) {
            return '+' + cleaned;
        } else if (cleaned.startsWith('0')) {
            return '+963' + cleaned.substring(1);
        }

        return phoneNumber; // Return as is if format is unclear
    }
}
