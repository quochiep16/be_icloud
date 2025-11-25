import { IsNotEmpty, IsPhoneNumber, Length, Matches } from 'class-validator';

export class CreateOrderDto {
  @IsNotEmpty({ message: 'Tên người nhận không được để trống' })
  shippingName: string;

  // đơn giản: kiểm tra là string không rỗng, không bắt buộc dùng IsPhoneNumber(VN)
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @Length(9, 15, { message: 'Số điện thoại phải có từ 9 đến 15 ký tự.' })
  @Matches(/^\+?\d+$/, {
    message: 'Số điện thoại không hợp lệ',
  })
  shippingPhone: string;

  @IsNotEmpty({ message: 'Địa chỉ giao hàng không được để trống' })
  shippingAddress: string;
}
