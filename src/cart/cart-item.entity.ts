import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Product } from '../products/product.entity';

@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.cartItems, {
    onDelete: 'CASCADE',
  })
  user: User;

  @ManyToOne(() => Product, (product) => product.cartItems, {
    onDelete: 'CASCADE',
    eager: true, // tự load product khi lấy cart
  })
  product: Product;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  // đánh dấu sản phẩm này được chọn để thanh toán
  @Column({ default: false })
  selected: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
