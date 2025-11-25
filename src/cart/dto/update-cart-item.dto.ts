import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateCartItemDto {
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Số lượng phải >= 1' })
  quantity?: number;

  @IsOptional()
  @IsBoolean()
  selected?: boolean;
}
