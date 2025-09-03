# File Upload Decorators

This module provides clean and reusable decorators for handling file uploads in NestJS applications.

## Available Decorators

### 1. `@SingleFileUpload(fieldName?, options?)`

For uploading a single file.

```typescript
import { SingleFileUpload } from 'src/common/decorators';

@Post('upload')
@SingleFileUpload('avatar', {
    destination: 'uploads/avatars',
    maxFileSize: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ['image/jpeg', 'image/png']
})
async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: any
) {
    // Handle single file upload
}
```

### 2. `@MultipleFilesUpload(fieldName?, options?)`

For uploading multiple files with the same field name.

```typescript
import { MultipleFilesUpload } from 'src/common/decorators';

@Post('upload-gallery')
@MultipleFilesUpload('photos', {
    destination: 'uploads/gallery',
    maxFiles: 5,
    maxFileSize: 5 * 1024 * 1024 // 5MB
})
async uploadGallery(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: any
) {
    // Handle multiple files upload
}
```

### 3. `@FileFieldsUpload(fields, options?)`

For uploading files with different field names.

```typescript
import { FileFieldsUpload } from 'src/common/decorators';

@Post('upload-mixed')
@FileFieldsUpload([
    { name: 'document', maxCount: 1 },
    { name: 'attachments', maxCount: 3 }
], {
    destination: 'uploads/documents',
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png']
})
async uploadMixed(
    @UploadedFiles() files: {
        document?: Express.Multer.File[];
        attachments?: Express.Multer.File[];
    },
    @Body() dto: any
) {
    // Handle mixed file uploads
}
```

### 4. `@ProductImagesUpload(options?)`

Pre-configured decorator for product images (mainImage + images).

```typescript
import { ProductImagesUpload } from 'src/common/decorators';

@Post('products/with-images')
@ProductImagesUpload()
async createProductWithImages(
    @UploadedFiles() files: {
        mainImage?: Express.Multer.File[];
        images?: Express.Multer.File[];
    },
    @Body() dto: CreateProductFormDataDto
) {
    // Handle product image uploads
}
```

### 5. `@CategoryImagesUpload(options?)`

Pre-configured decorator for category images.

```typescript
import { CategoryImagesUpload } from 'src/common/decorators';

@Post('categories/with-images')
@CategoryImagesUpload()
async createCategoryWithImages(
    @UploadedFiles() files: {
        image?: Express.Multer.File[];
        banner?: Express.Multer.File[];
    },
    @Body() dto: CreateCategoryFormDataDto
) {
    // Handle category image uploads
}
```

### 6. `@AvatarUpload(options?)`

Pre-configured decorator for user avatars.

```typescript
import { AvatarUpload } from 'src/common/decorators';

@Post('users/avatar')
@AvatarUpload()
async uploadUserAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: any
) {
    // Handle avatar upload
}
```

## Configuration Options

All decorators accept an optional `FileUploadOptions` object:

```typescript
interface FileUploadOptions {
  destination?: string; // Upload directory (default: 'uploads')
  maxFileSize?: number; // Max file size in bytes (default: 5MB)
  allowedMimeTypes?: string[]; // Allowed file types (default: images only)
  maxFiles?: number; // Max number of files (default: 10)
}
```

### Default Configuration

```typescript
const defaultOptions = {
  destination: 'uploads',
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
  maxFiles: 10,
};
```

## Usage Examples

### Custom Configuration

```typescript
@Post('upload')
@SingleFileUpload('file', {
    destination: 'uploads/custom',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['application/pdf', 'text/plain']
})
async uploadCustom(@UploadedFile() file: Express.Multer.File) {
    // Custom upload handling
}
```

### With Guards and Validation

```typescript
@Post('secure-upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ProductImagesUpload({
    maxFileSize: 2 * 1024 * 1024 // 2MB limit for admin uploads
})
async secureUpload(
    @UploadedFiles() files: {
        mainImage?: Express.Multer.File[];
        images?: Express.Multer.File[];
    },
    @Request() req
) {
    // Secure upload with authentication
}
```

## File Processing

After upload, files are automatically stored with unique names using UUID v4. You can access file information:

```typescript
async handleUpload(@UploadedFile() file: Express.Multer.File) {
    console.log({
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype
    });
}
```

## Error Handling

The decorators automatically handle:

- File type validation
- File size limits
- Invalid file errors

Errors are thrown as `BadRequestException` with descriptive messages.

## Benefits

1. **Clean Code**: Reduces boilerplate code significantly
2. **Reusable**: Use across multiple controllers and endpoints
3. **Type Safe**: Full TypeScript support
4. **Configurable**: Flexible options for different use cases
5. **Pre-configured**: Ready-to-use decorators for common scenarios
6. **Consistent**: Standardized file upload handling across the application
