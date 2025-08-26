#!/usr/bin/env node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { MainSeedService } from './main.seed';

async function bootstrap() {
    try {
        console.log('🚀 Starting Shamra Backend Seeding CLI...');

        // Create minimal app context for seeding
        const app = await NestFactory.createApplicationContext(AppModule);

        // Get the main seed service
        const mainSeedService = app.get(MainSeedService);

        // Get command line arguments
        const command = process.argv[2];

        switch (command) {
            case 'seed':
                console.log('🌱 Running seed command...');
                await mainSeedService.seedAll();
                break;

            case 'clear':
                console.log('🧹 Running clear command...');
                await mainSeedService.clearAll();
                break;

            case 'reset':
                console.log('🔄 Running reset command...');
                await mainSeedService.reset();
                break;

            default:
                console.log('❌ Invalid command. Available commands:');
                console.log('   npm run seed:seed    - Seed all data');
                console.log('   npm run seed:clear   - Clear all data');
                console.log('   npm run seed:reset   - Reset (clear + seed) all data');
                process.exit(1);
        }

        console.log('✅ CLI operation completed successfully!');
        await app.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error during CLI operation:', error);
        process.exit(1);
    }
}

// Run the CLI
bootstrap();
