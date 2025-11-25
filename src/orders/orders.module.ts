import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CartItem } from '../cart/cart-item.entity';
import { User } from '../users/user.entity';
import { Product } from '../products/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, CartItem, User, Product])],
  providers: [OrdersService],
  controllers: [OrdersController],
})
export class OrdersModule {}
