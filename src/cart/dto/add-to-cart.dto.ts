import { IsInt, Min } from 'class-validator';

export class AddToCartDto {
  @IsInt()
  productId: number;

  @IsInt()
  @Min(1, { message: 'Số lượng phải >= 1' })
  quantity: number;
}
