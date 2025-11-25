import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from './cart-item.entity';
import { Product } from '../products/product.entity';
import { User } from '../users/user.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartRepo: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async getMyCart(userId: number) {
    const items = await this.cartRepo.find({
      where: { user: { id: userId } },
      relations: ['product', 'user'],
    });

    // Lọc ra các item có product còn active
    const activeItems = items.filter((i) => {
      const p = i.product as any;
      // product tồn tại và không bị tắt
      return p && p.isActive !== false;
    });

    // (tuỳ chọn) dọn luôn các item có product đã tắt khỏi DB
    const inactiveItems = items.filter((i) => {
      const p = i.product as any;
      return !p || p.isActive === false;
    });
    if (inactiveItems.length > 0) {
      await this.cartRepo.remove(inactiveItems);
    }

    const totalItems = activeItems.reduce((sum, i) => sum + i.quantity, 0);
    const totalPrice = activeItems.reduce(
      (sum, i) => sum + i.quantity * Number(i.product.price),
      0,
    );
    const selectedTotalPrice = activeItems
      .filter((i) => i.selected)
      .reduce((sum, i) => sum + i.quantity * Number(i.product.price), 0);

    return {
      items: activeItems,
      totalItems,
      totalPrice,
      selectedTotalPrice,
    };
  }


  async addToCart(userId: number, dto: AddToCartDto) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User không tồn tại');

    const product = await this.productsRepo.findOne({
      where: { id: dto.productId },
    });
    if (!product) throw new NotFoundException('Sản phẩm không tồn tại');

    if ((product as any).isActive === false) {
      throw new BadRequestException('Sản phẩm hiện đã ngừng kinh doanh');
    }

    if (product.stock <= 0) {
      throw new BadRequestException('Sản phẩm đã hết hàng');
    }

    const existing = await this.cartRepo.findOne({
      where: { user: { id: userId }, product: { id: dto.productId } },
      relations: ['user', 'product'],
    });

    const currentQty = existing?.quantity ?? 0;
    const newQty = currentQty + dto.quantity;

    if (newQty > product.stock) {
      throw new BadRequestException(
        `Số lượng vượt quá tồn kho. Hiện còn ${product.stock} sản phẩm.`,
      );
    }

    if (existing) {
      existing.quantity = newQty;
      existing.selected = true;
      return this.cartRepo.save(existing);
    }

    const item = this.cartRepo.create({
      user,
      product,
      quantity: dto.quantity,
      selected: true,
    });
    return this.cartRepo.save(item);
  }

  async updateCartItem(
    userId: number,
    itemId: number,
    dto: UpdateCartItemDto,
  ) {
    const item = await this.cartRepo.findOne({
      where: { id: itemId },
      relations: ['user', 'product'],
    });
    if (!item) throw new NotFoundException('Item không tồn tại');
    if (item.user.id !== userId) {
      throw new ForbiddenException('Không thể sửa giỏ hàng của người khác');
    } 
    if ((item.product as any).isActive === false) {
      throw new BadRequestException(
        'Sản phẩm trong giỏ hàng này đã ngừng kinh doanh. Vui lòng xoá khỏi giỏ.',
      );
    }

    if (dto.quantity !== undefined) {
      if (dto.quantity <= 0) {
        throw new BadRequestException('Số lượng phải lớn hơn 0');
      }
      if (dto.quantity > item.product.stock) {
        throw new BadRequestException(
          `Số lượng vượt quá tồn kho. Hiện còn ${item.product.stock} sản phẩm.`,
        );
      }
      item.quantity = dto.quantity;
    }

    if (dto.selected !== undefined) {
      item.selected = dto.selected;
    }

    return this.cartRepo.save(item);
  }

  async removeCartItem(userId: number, itemId: number) {
    const item = await this.cartRepo.findOne({
      where: { id: itemId },
      relations: ['user'],
    });
    if (!item) throw new NotFoundException('Item không tồn tại');
    if (item.user.id !== userId) {
      throw new ForbiddenException('Không thể xoá giỏ hàng của người khác');
    }
    await this.cartRepo.remove(item);
    return { success: true };
  }
}
