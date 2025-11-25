import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

    async register(dto: RegisterDto) {
    // Kiểm tra email đã tồn tại chưa
    const existingByEmail = await this.usersRepo.findOne({
        where: { email: dto.email },
    });
    if (existingByEmail) {
        throw new ConflictException('Email đã được sử dụng');
    }

    // Kiểm tra tên đã tồn tại chưa
    const existingByName = await this.usersRepo.findOne({
        where: { name: dto.name },
    });
    if (existingByName) {
        throw new ConflictException('Tên người dùng đã được sử dụng');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = this.usersRepo.create({
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: UserRole.USER,
    });

    await this.usersRepo.save(user);

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
    };
    }

  async login(dto: LoginDto) {
    const user = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Sai email hoặc mật khẩu');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Sai email hoặc mật khẩu');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
