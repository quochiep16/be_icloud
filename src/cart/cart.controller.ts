import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Controller('cart')
@UseGuards(JwtAuthGuard) // mọi API giỏ hàng đều cần login
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // GET /api/cart
  @Get()
  getMyCart(@CurrentUser() user: any) {
    return this.cartService.getMyCart(user.id);
  }

  // POST /api/cart
  @Post()
  addToCart(@CurrentUser() user: any, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart(user.id, dto);
  }

  // PATCH /api/cart/:id
  @Patch(':id')
  updateCartItem(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateCartItem(user.id, +id, dto);
  }

  // DELETE /api/cart/:id
  @Delete(':id')
  removeCartItem(@CurrentUser() user: any, @Param('id') id: string) {
    return this.cartService.removeCartItem(user.id, +id);
  }
}
