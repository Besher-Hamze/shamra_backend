import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MerchantsService } from './merchants.service';
import { MerchantsController } from './merchants.controller';
import { Merchant, MerchantSchema } from './scheme/merchant.scheme';
import { User, UserSchema } from 'src/users/scheme/user.scheme';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Merchant.name, schema: MerchantSchema },
            { name: User.name, schema: UserSchema },
        ]),
    ],
    controllers: [MerchantsController],
    providers: [MerchantsService],
    exports: [MerchantsService],
})
export class MerchantsModule { }
