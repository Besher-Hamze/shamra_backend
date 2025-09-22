// User Roles
export enum UserRole {
    ADMIN = 'admin',
    MANAGER = 'manager',
    EMPLOYEE = 'employee',
    CUSTOMER = 'customer',
    MERCHANT = 'merchant',
}

// Order Status
export enum OrderStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    PROCESSING = 'processing',
    SHIPPED = 'shipped',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled',
    RETURNED = 'returned',
}

// Product Status
export enum ProductStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    OUT_OF_STOCK = 'out_of_stock',
    DISCONTINUED = 'discontinued',
}

// SubCategory Types
export enum SubCategoryType {
    FREE_ATTR = 'free_attr',
    CUSTOM_ATTR = 'custom_attr',
}

// Inventory Transaction Types
export enum InventoryTransactionType {
    PURCHASE = 'purchase',
    SALE = 'sale',
    TRANSFER = 'transfer',
    ADJUSTMENT = 'adjustment',
    RETURN = 'return',
}

// Notification Types
export enum NotificationType {
    ORDER_CREATED = 'order_created',
    ORDER_UPDATED = 'order_updated',
    LOW_STOCK = 'low_stock',
    OUT_OF_STOCK = 'out_of_stock',
    PROMOTION_STARTED = 'promotion_started',
    PROMOTION_ENDED = 'promotion_ended',
    SYSTEM = 'system',
}

// Promotion Types
export enum PromotionType {
    PERCENTAGE = 'percentage',
    FIXED_AMOUNT = 'fixed_amount',
    BUY_X_GET_Y = 'buy_x_get_y',
    FREE_SHIPPING = 'free_shipping',
}

// File Types
export enum FileType {
    IMAGE = 'image',
    DOCUMENT = 'document',
    VIDEO = 'video',
    OTHER = 'other',
}

// Payment Status
export enum PaymentStatus {
    PENDING = 'pending',
    PAID = 'paid',
    FAILED = 'failed',
    REFUNDED = 'refunded',
    PARTIAL = 'partial',
}