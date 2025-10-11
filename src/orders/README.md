# Orders Management System

## Overview

The orders management system handles order creation, updates, and filtering with comprehensive support for category-based filtering.

## Features

### Order Filtering

The `findAll` method supports multiple filtering options:

#### Basic Filters

- **branchId**: Filter orders by branch
- **status**: Filter by order status (pending, confirmed, processing, shipped, delivered, cancelled, returned)
- **isPaid**: Filter by payment status (true/false)
- **search**: Search in order number and notes

#### Category Filtering

- **categoryId**: Filter orders that contain items with products from a specific category

### Category Filtering Implementation

The category filtering uses MongoDB aggregation pipeline to:

1. **Lookup Products**: Join orders with products collection using `items.productId`
2. **Filter by Category**: Match orders where any product belongs to the specified category
3. **Maintain Performance**: Use efficient aggregation with proper indexing

#### Example Usage

```typescript
// Get all orders with products from category "Electronics"
const orders = await ordersService.findAll({
  categoryId: '64a1b2c3d4e5f6789012345',
  page: 1,
  limit: 20,
});

// Combine with other filters
const electronicsOrders = await ordersService.findAll({
  categoryId: '64a1b2c3d4e5f6789012345',
  status: OrderStatus.DELIVERED,
  branchId: '64a1b2c3d4e5f6789012346',
  isPaid: true,
});
```

#### API Endpoint

```http
GET /orders?categoryId=64a1b2c3d4e5f6789012345&status=delivered&page=1&limit=20
```

### Performance Considerations

1. **Indexing**: Ensure proper indexes on:
   - `orders.items.productId`
   - `products.categoryId`
   - `orders.branchId`
   - `orders.status`

2. **Aggregation Pipeline**: The category filter uses efficient aggregation with:
   - `$lookup` to join collections
   - `$match` to filter results
   - `$unset` to remove temporary fields

3. **Pagination**: Proper pagination is maintained even with category filtering

### Response Format

```json
{
  "success": true,
  "message": "تم جلب الطلبات بنجاح",
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012347",
      "orderNumber": "ORD12345678",
      "items": [
        {
          "productId": "64a1b2c3d4e5f6789012348",
          "productName": "iPhone 15",
          "quantity": 1,
          "price": 999,
          "total": 999
        }
      ],
      "subtotal": 999,
      "totalAmount": 999,
      "status": "delivered",
      "userId": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "branch": {
        "name": "Main Branch",
        "code": "MB001"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Technical Details

### Aggregation Pipeline Structure

```javascript
[
  { $match: { isDeleted: { $ne: true } /* other filters */ } },
  {
    $lookup: {
      from: 'products',
      localField: 'items.productId',
      foreignField: '_id',
      as: 'products',
    },
  },
  {
    $match: {
      'products.categoryId': ObjectId('categoryId'),
    },
  },
  { $unset: 'products' },
  { $sort: { createdAt: -1 } },
  { $skip: 0 },
  { $limit: 20 },
  // ... population stages
];
```

### Error Handling

- Invalid categoryId format returns validation error
- Non-existent categoryId returns empty results
- Database errors are properly handled and logged

## Usage Examples

### Frontend Integration

```javascript
// React/Next.js example
const fetchOrdersByCategory = async (categoryId) => {
  const response = await fetch(
    `/api/orders?categoryId=${categoryId}&page=1&limit=20`,
  );
  const data = await response.json();
  return data;
};

// Vue.js example
const orders = ref([]);
const fetchOrders = async (filters) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/orders?${params}`);
  const data = await response.json();
  orders.value = data.data;
};
```

### Backend Service Usage

```typescript
// In a controller or service
async getElectronicsOrders() {
  return await this.ordersService.findAll({
    categoryId: 'electronics-category-id',
    status: OrderStatus.DELIVERED,
    sort: '-createdAt'
  });
}
```
