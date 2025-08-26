# 🌱 Shamra Backend Seeding System

This directory contains the seeding system for the Shamra Backend application. The seeding system allows you to populate your database with initial data for development, testing, and production setup.

## 🚀 Features

- **User Seeding**: Creates admin, manager, and employee users with default branches
- **Category Seeding**: Populates product categories with Arabic and English names
- **Product Seeding**: Creates sample products across different categories
- **Settings Seeding**: Initializes system settings and configurations
- **Dependency Management**: Handles seeding order automatically
- **CLI Support**: Command-line interface for seeding operations
- **API Endpoints**: REST endpoints for seeding operations (admin only)

## 📁 Structure

```
src/seeds/
├── README.md                 # This file
├── index.ts                  # Exports all seed services
├── seeds.module.ts           # NestJS module for seeding
├── main.seed.ts              # Main orchestrator service
├── users.seed.ts             # User and branch seeding
├── categories.seed.ts        # Product categories seeding
├── products.seed.ts          # Product seeding
├── settings.seed.ts          # System settings seeding
├── seeds.controller.ts       # REST API controller
└── seed-cli.ts              # CLI script
```

## 🛠️ Usage

### 1. CLI Commands

```bash
# Seed all data
npm run seed:seed

# Clear all data
npm run seed:clear

# Reset (clear + seed) all data
npm run seed:reset
```

### 2. API Endpoints

After starting your application, you can use these endpoints (admin authentication required):

```bash
# Seed all data
POST /api/v1/seeds/seed

# Clear all data
DELETE /api/v1/seeds/clear

# Reset all data
POST /api/v1/seeds/reset
```

### 3. Programmatic Usage

```typescript
import { MainSeedService } from './seeds';

// In your service or controller
constructor(private readonly mainSeedService: MainSeedService) {}

// Seed all data
await this.mainSeedService.seedAll();

// Clear all data
await this.mainSeedService.clearAll();

// Reset all data
await this.mainSeedService.reset();
```

## 👥 Default Users

The seeding system creates three default users:

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| **Admin** | `admin@shamra.com` | `admin123` | Full system access |
| **Manager** | `manager@shamra.com` | `manager123` | Branch and inventory management |
| **Employee** | `employee@shamra.com` | `employee123` | Basic operations |

## 🏷️ Default Categories

- **Electronics** (إلكترونيات)
- **Smartphones** (هواتف ذكية)
- **Computers & Laptops** (حواسيب ومحمولة)
- **Audio & Speakers** (صوت ومكبرات صوت)
- **Gaming** (ألعاب)
- **Cameras & Photography** (كاميرات وتصوير)
- **Home Appliances** (أجهزة منزلية)
- **Accessories** (ملحقات)

## 📱 Sample Products

The system creates realistic sample products including:
- iPhone 15 Pro
- Samsung Galaxy S24 Ultra
- MacBook Pro 16" M3 Pro
- Dell XPS 15
- Sony WH-1000XM5 Headphones
- PlayStation 5
- Canon EOS R6 Mark II
- LG OLED TV 65" C3

## ⚙️ System Settings

Default settings include:
- Company information (bilingual)
- Business configurations
- Email server settings
- Notification preferences
- System security settings
- Payment method configurations

## 🔒 Security

- All seeding endpoints require **ADMIN** role authentication
- CLI commands can be run independently
- Seeding operations are idempotent (safe to run multiple times)
- Existing data is preserved unless explicitly cleared

## 🚨 Important Notes

1. **Database Connection**: Ensure MongoDB is running and accessible
2. **Environment Variables**: Set `MONGODB_URI` in your `.env` file
3. **Dependencies**: Categories must be seeded before products
4. **Production**: Use seeding only in development/testing environments
5. **Backup**: Always backup your database before running clear/reset operations

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check if MongoDB is running
   - Verify connection string in `.env` file

2. **Permission Denied**
   - Ensure you're logged in as an admin user
   - Check JWT token validity

3. **Seeding Fails**
   - Check console logs for specific error messages
   - Verify database schema compatibility
   - Ensure all required modules are imported

### Debug Mode

Enable debug logging by setting environment variable:
```bash
DEBUG=seeds:* npm run seed:seed
```

## 📚 API Documentation

For detailed API documentation, see the main API documentation or use the Postman collection provided in the project root.

## 🤝 Contributing

When adding new seed data:
1. Create a new seed service following the existing pattern
2. Add it to the `SeedsModule`
3. Update the `MainSeedService` to include the new service
4. Add appropriate error handling and logging
5. Update this README with new information

## 📄 License

This seeding system is part of the Shamra Backend project and follows the same licensing terms.
