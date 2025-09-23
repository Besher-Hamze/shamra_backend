import { Document } from 'mongoose';
import { Branch } from 'src/branches/scheme/branche.scheme';

// Base interface for all documents
export interface BaseDocument extends Document {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
    isDeleted?: boolean;
}

// Pagination interface
export interface PaginationResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

// API Response interface
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    pagination?: any;
    error?: any;
}

// JWT Payload interface
export interface JwtPayload {
    sub: string;
    email: string;
    role: string;
    branchId?: string;
    selectedBranchId?: string;
    selectedBranchObject?: Branch;
    iat?: number;
    exp?: number;
}