import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface FileUploadOptions {
    destination?: string;
    maxFileSize?: number;
    allowedMimeTypes?: string[];
    maxFiles?: number;
}

export interface FileFieldConfig {
    name: string;
    maxCount: number;
}

const defaultOptions: Required<FileUploadOptions> = {
    destination: 'uploads',
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp'
    ],
    maxFiles: 10
};

function createMulterConfig(options: Required<FileUploadOptions>) {
    return {
        storage: diskStorage({
            destination: join(process.cwd(), options.destination),
            filename: (req, file, callback) => {
                const uniqueSuffix = uuidv4();
                const ext = extname(file.originalname);
                callback(null, `${uniqueSuffix}${ext}`);
            },
        }),
        fileFilter: (req, file, callback) => {
            if (options.allowedMimeTypes.includes(file.mimetype)) {
                callback(null, true);
            } else {
                callback(new Error(`Invalid file type. Allowed types: ${options.allowedMimeTypes.join(', ')}`), false);
            }
        },
        limits: {
            fileSize: options.maxFileSize,
        },
    };
}

/**
 * Decorator for single file upload
 * @param fieldName - The name of the form field
 * @param options - Upload configuration options
 */
export function SingleFileUpload(fieldName: string = 'file', options: FileUploadOptions = {}) {
    const config = { ...defaultOptions, ...options };
    const multerConfig = createMulterConfig(config);

    return applyDecorators(
        UseInterceptors(FileInterceptor(fieldName, multerConfig))
    );
}

/**
 * Decorator for multiple files upload (same field name)
 * @param fieldName - The name of the form field
 * @param options - Upload configuration options
 */
export function MultipleFilesUpload(fieldName: string = 'files', options: FileUploadOptions = {}) {
    const config = { ...defaultOptions, ...options };
    const multerConfig = createMulterConfig(config);

    return applyDecorators(
        UseInterceptors(FilesInterceptor(fieldName, config.maxFiles, multerConfig))
    );
}

/**
 * Decorator for multiple file fields upload
 * @param fields - Array of field configurations
 * @param options - Upload configuration options
 */
export function FileFieldsUpload(fields: FileFieldConfig[], options: FileUploadOptions = {}) {
    const config = { ...defaultOptions, ...options };
    const multerConfig = createMulterConfig(config);

    return applyDecorators(
        UseInterceptors(FileFieldsInterceptor(fields, multerConfig))
    );
}

/**
 * Decorator specifically for product images (mainImage + images)
 * @param options - Upload configuration options
 */
export function ProductImagesUpload(options: FileUploadOptions = {}) {
    const config = {
        ...defaultOptions,
        destination: 'uploads/products',
        ...options
    };

    return FileFieldsUpload([
        { name: 'mainImage', maxCount: 1 },
        { name: 'images', maxCount: 10 }
    ], config);
}

/**
 * Decorator for category images
 * @param options - Upload configuration options
 */
export function CategoryImagesUpload(options: FileUploadOptions = {}) {
    const config = {
        ...defaultOptions,
        destination: 'uploads/categories',
        ...options
    };

    return FileFieldsUpload([
        { name: 'image', maxCount: 1 },
        { name: 'banner', maxCount: 1 }
    ], config);
}

/**
 * Decorator for sub category images
 * @param options - Upload configuration options
 */
export function SubCategoryImagesUpload(options: FileUploadOptions = {}) {
    const config = {
        ...defaultOptions,
        destination: 'uploads/sub-categories',
        ...options
    };

    return FileFieldsUpload([
        { name: 'image', maxCount: 1 }
    ], config);
}
/**
 * Decorator for user avatar upload
 * @param options - Upload configuration options
 */
export function AvatarUpload(options: FileUploadOptions = {}) {
    const config = {
        ...defaultOptions,
        destination: 'uploads/avatars',
        maxFileSize: 2 * 1024 * 1024, // 2MB for avatars
        ...options
    };

    return SingleFileUpload('avatar', config);
}
