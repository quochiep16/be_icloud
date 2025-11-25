import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../common/enums/user-role.enum';

const ROOT_ADMIN_EMAIL = 'quochiep1610@admin.com';
const ROOT_ADMIN_PASSWORD = '@Ngulon123';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  // 👇 chạy khi module Users được khởi tạo
  async onModuleInit() {
    let root = await this.usersRepo.findOne({
      where: { email: ROOT_ADMIN_EMAIL },
    });

    if (!root) {
      // chưa có → tạo mới
      const passwordHash = await bcrypt.hash(ROOT_ADMIN_PASSWORD, 10);
      root = this.usersRepo.create({
        name: 'Root Admin',
        email: ROOT_ADMIN_EMAIL,
        passwordHash,
        role: UserRole.ADMIN,
        isSystem: true,
      });
      await this.usersRepo.save(root);
    } else {
      // đã có → đảm bảo luôn là ADMIN + isSystem = true
      let needSave = false;

      if (root.role !== UserRole.ADMIN) {
        root.role = UserRole.ADMIN;
        needSave = true;
      }
      if (!root.isSystem) {
        root.isSystem = true;
        needSave = true;
      }

      if (needSave) {
        await this.usersRepo.save(root);
      }
    }
  }

  findAll() {
    return this.usersRepo.find();
  }

  findOne(id: number) {
    return this.usersRepo.findOne({ where: { id } });
  }

  async create(dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: dto.role ?? undefined,
    });
    return this.usersRepo.save(user);
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User không tồn tại');

    // 👇 chặn sửa tài khoản hệ thống
    if (user.isSystem) {
      throw new BadRequestException(
        'Không được phép chỉnh sửa tài khoản admin gốc.',
      );
    }

    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
      delete dto.password;
    }

    Object.assign(user, dto);

    return this.usersRepo.save(user);
  }

  async remove(id: number) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User không tồn tại');

    // 👇 chặn xoá tài khoản hệ thống
    if (user.isSystem) {
      throw new BadRequestException(
        'Không được phép xoá tài khoản admin gốc.',
      );
    }

    // hiện tại bạn đang chỉ trả về success, chưa xoá thực
    // nếu sau này muốn xoá cứng:
    // await this.usersRepo.remove(user);

    return { success: true };
  }
}
