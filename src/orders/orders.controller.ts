import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // POST /api/orders/checkout
  @Post('checkout')
  checkout(@CurrentUser() user: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.checkout(user.id, dto);
  }

  // GET /api/orders/me
  @Get('me')
  getMyOrders(@CurrentUser() user: any) {
    return this.ordersService.findMyOrders(user.id);
  }

  // GET /api/orders/me/:id
  @Get('me/:id')
  getMyOrderDetail(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ordersService.findMyOrderById(user.id, +id);
  }

  // ADMIN: GET /api/orders
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  getAllOrders() {
    return this.ordersService.findAll();
  }

  // ADMIN: PATCH /api/orders/:id/status
  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(+id, dto);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  getOrderDetail(@Param('id') id: string) {
    return this.ordersService.findOne(+id);
  }
}   
