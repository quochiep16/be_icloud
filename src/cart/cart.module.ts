import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CartItem } from './cart-item.entity';
import { Product } from '../products/product.entity';
import { User } from '../users/user.entity';

import { CartService } from './cart.service';
import { CartController } from './cart.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CartItem, Product, User])],
  providers: [CartService],
  controllers: [CartController],
})
export class CartModule {}
