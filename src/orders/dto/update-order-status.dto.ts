import { IsEnum } from 'class-validator';
import { OrderStatus } from '../entities/order-status.enum';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus, { message: 'Trạng thái không hợp lệ' })
  status: OrderStatus;
}
