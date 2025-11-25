import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FileInterceptor } from '@nestjs/platform-express';

import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

import cloudinary from '../cloudinary';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // PUBLIC: get all + search
  @Get()
  findAll(@Query('search') search?: string) {
    return this.productsService.findAll(search);
  }

  // PUBLIC: get detail
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  // ADMIN: create product (bắt buộc có ảnh)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/products',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file && !file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException('File tải lên phải là ảnh'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async create(
    @Body() dto: CreateProductDto,
    @UploadedFile() file: any, // dùng any để tránh lỗi isolatedModules
  ) {
    if (!file) {
      throw new BadRequestException('Ảnh sản phẩm là bắt buộc');
    }

    try {
      const uploadResult = await cloudinary.uploader.upload(file.path, {
        folder: 'products',
      });
      const imageUrl = uploadResult.secure_url;
      return this.productsService.create(dto, imageUrl);
    } catch (error) {
      console.error('Cloudinary upload error (create product):', error);
      throw new BadRequestException('Upload ảnh thất bại');
    }
  }

  // ADMIN: update (có thể đổi ảnh hoặc không)
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/products',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file && !file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException('File tải lên phải là ảnh'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @UploadedFile() file?: any,
  ) {
    let imageUrl: string | undefined;

    if (file) {
      try {
        const uploadResult = await cloudinary.uploader.upload(file.path, {
          folder: 'products',
        });
        imageUrl = uploadResult.secure_url;
      } catch (error) {
        console.error('Cloudinary upload error (update product):', error);
        throw new BadRequestException('Upload ảnh thất bại');
      }
    }

    return this.productsService.update(+id, dto, imageUrl);
  }

  // ADMIN: delete
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }
}
