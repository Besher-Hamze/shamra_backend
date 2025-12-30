import { Injectable, BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FilesService {
    private readonly uploadPath = 'uploads';
    private readonly allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/heic',
    ];
    private readonly maxFileSize = 5 * 1024 * 1024; // 5MB

    constructor() {
        this.ensureUploadDirectoryExists();
    }

    private ensureUploadDirectoryExists() {
        const uploadDir = join(process.cwd(), this.uploadPath, 'products');
        if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true });
        }
    }

    validateFile(file: Express.Multer.File): void {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        if (!this.allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException(
                `File type not allowed. Allowed types: ${this.allowedMimeTypes.join(', ')}`
            );
        }

        if (file.size > this.maxFileSize) {
            throw new BadRequestException(
                `File size too large. Maximum size: ${this.maxFileSize / (1024 * 1024)}MB`
            );
        }
    }

    generateFileName(originalName: string): string {
        const fileExtension = originalName.split('.').pop();
        return `${uuidv4()}.${fileExtension}`;
    }

    getFileUrl(filename: string): string {
        return `/uploads/products/${filename}`;
    }

    processUploadedFiles(files: {
        mainImage?: Express.Multer.File[];
        images?: Express.Multer.File[];
    }): { mainImage?: string; images?: string[] } {
        const result: { mainImage?: string; images?: string[] } = {};

        if (files.mainImage && files.mainImage[0]) {
            this.validateFile(files.mainImage[0]);
            result.mainImage = this.getFileUrl(files.mainImage[0].filename);
        }

        if (files.images && files.images.length > 0) {
            result.images = files.images.map(file => {
                this.validateFile(file);
                return this.getFileUrl(file.filename);
            });
        }

        return result;
    }
}
