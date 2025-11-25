import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatus } from './entities/order-status.enum';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

import { CartItem } from '../cart/cart-item.entity';
import { User } from '../users/user.entity';
import { Product } from '../products/product.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepo: Repository<OrderItem>,
    @InjectRepository(CartItem)
    private readonly cartRepo: Repository<CartItem>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
  ) {}

  private generateOrderCode(): string {
    const now = new Date();
    return (
      'ORD-' +
      now.getFullYear().toString().slice(-2) +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0') +
      '-' +
      now.getTime().toString().slice(-6)
    );
  }

  // Tạo đơn từ các cartItem được chọn
  async checkout(userId: number, dto: CreateOrderDto) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User không tồn tại');

    const cartItems = await this.cartRepo.find({
      where: { user: { id: userId }, selected: true },
      relations: ['product', 'user'],
    });

    if (!cartItems.length) {
      throw new BadRequestException(
        'Giỏ hàng không có sản phẩm nào được chọn để thanh toán',
      );
    }

for (const item of cartItems) {
  const product = item.product;

  // ❌ Nếu sản phẩm đã bị tắt (isActive = false) → không cho checkout
      if (product.isActive === false) {
        throw new BadRequestException(
          `Sản phẩm "${product.name}" hiện đã ngừng kinh doanh. Vui lòng xoá khỏi giỏ hàng.`,
        );
      }

      const stock = Number(product.stock);
      if (item.quantity > stock) {
        throw new BadRequestException(
          `Sản phẩm "${product.name}" chỉ còn ${stock} sản phẩm trong kho. Vui lòng chỉnh lại số lượng.`,
        );
      }
    }

    // 2) Tính tổng tiền
    const totalAmount = cartItems.reduce(
      (sum, item) => sum + item.quantity * Number(item.product.price),
      0,
    );

    // 3) Tạo order
    const order = this.ordersRepo.create({
      code: this.generateOrderCode(),
      user,
      totalAmount,
      status: OrderStatus.PENDING,
      shippingName: dto.shippingName,
      shippingPhone: dto.shippingPhone,
      shippingAddress: dto.shippingAddress,
    });

    const savedOrder = await this.ordersRepo.save(order);

    // 4) Tạo order_items
    const orderItems: OrderItem[] = [];

    for (const item of cartItems) {
      const orderItem = this.orderItemsRepo.create({
        order: savedOrder,
        product: item.product,
        productName: item.product.name,
        unitPrice: Number(item.product.price),
        quantity: item.quantity,
        totalPrice: item.quantity * Number(item.product.price),
      });
      orderItems.push(orderItem);
    }

    await this.orderItemsRepo.save(orderItems);

    // 5) Trừ tồn kho sản phẩm
    for (const item of cartItems) {
      const product = await this.productsRepo.findOne({
        where: { id: item.product.id },
      });
      if (!product) continue;

      const stock = Number(product.stock);
      const newStock = stock - item.quantity;
      product.stock = newStock < 0 ? 0 : newStock;
      await this.productsRepo.save(product);
    }

    // 6) Xoá các cartItem đã thanh toán
    await this.cartRepo.remove(cartItems);

    // 7) Load lại order đầy đủ
    const fullOrder = await this.ordersRepo.findOne({
      where: { id: savedOrder.id },
      relations: ['items', 'items.product', 'user'],
    });

    return fullOrder;
  }

  // user xem danh sách đơn của mình
  async findMyOrders(userId: number) {
    return this.ordersRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  // user xem chi tiết đơn của mình
  async findMyOrderById(userId: number, orderId: number) {
    const order = await this.ordersRepo.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product', 'user'],
    });

    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');
    if (order.user.id !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem đơn này');
    }

    return order;
  }

  // admin xem chi tiết 1 đơn bất kỳ
  async findOne(orderId: number) {
    const order = await this.ordersRepo.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product', 'user'],
    });

    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');

    return order;
  }

  // admin xem tất cả đơn
  async findAll() {
    return this.ordersRepo.find({
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
  }

  // admin cập nhật trạng thái đơn
  async updateStatus(orderId: number, dto: UpdateOrderStatusDto) {
    const order = await this.ordersRepo.findOne({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');

    order.status = dto.status;
    return this.ordersRepo.save(order);
  }
}
