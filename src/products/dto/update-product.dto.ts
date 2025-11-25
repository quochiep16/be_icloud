import { IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
  name?: string;

  @IsOptional()
  @IsNotEmpty({ message: 'Mô tả không được để trống' })
  description?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Giá phải là số' })
  @Min(0, { message: 'Giá phải lớn hơn hoặc bằng 0' })
  price?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Tồn kho phải là số' })
  @Min(0, { message: 'Tồn kho phải lớn hơn hoặc bằng 0' })
  stock?: number;
}
