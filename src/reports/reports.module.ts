import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Order, OrderSchema } from '../orders/schemes/order.scheme';
import { Product, ProductSchema } from '../products/scheme/product.schem';
import { Customer, CustomerSchema } from '../customers/scheme/customer.scheme';
import { User, UserSchema } from '../users/scheme/user.scheme';
import { Branch, BranchSchema } from '../branches/scheme/branche.scheme';
import { Inventory, InventorySchema } from '../inventory/scheme/inventory.scheme';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: User.name, schema: UserSchema },
      { name: Branch.name, schema: BranchSchema },
      { name: Inventory.name, schema: InventorySchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule { }
