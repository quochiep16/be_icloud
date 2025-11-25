import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'Tên không được để trống' })
  name: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  // > 6 ký tự → minLength = 7
  @MinLength(7, { message: 'Mật khẩu phải có ít nhất 7 ký tự' })
  @IsNotEmpty({ message: 'Mật Khẩu không được để trống' })
  password: string;
}
