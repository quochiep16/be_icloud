import { IsEmail, IsEnum, IsOptional, MinLength } from 'class-validator';
import { UserRole } from '../../common/enums/user-role.enum';

export class UpdateUserDto {
  @IsOptional()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
