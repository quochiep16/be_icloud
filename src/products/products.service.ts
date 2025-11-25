import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';

import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
  ) {}

  async findAll(search?: string) {
    if (search && search.trim() !== '') {
      const keyword = `%${search.trim()}%`;
      return this.productsRepo.find({
        where: [
          { name: ILike(keyword), isActive: true },
          { description: ILike(keyword), isActive: true },
        ],
        order: { createdAt: 'DESC' },
      });
    }

    return this.productsRepo.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }


  async findOne(id: number) {
    const product = await this.productsRepo.findOne({
      where: { id, isActive: true },
    });
    if (!product) throw new NotFoundException('Sản phẩm không tồn tại');
    return product;
  }


  async create(dto: CreateProductDto, imageUrl: string) {
    const product = this.productsRepo.create({
      name: dto.name,
      description: dto.description,
      price: dto.price,
      stock: dto.stock ?? 0,
      imageUrl,
      isActive: true, // 👈 NEW
    });

    return this.productsRepo.save(product);
  }


  async update(id: number, dto: UpdateProductDto, imageUrl?: string) {
    const product = await this.productsRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Sản phẩm không tồn tại');

    Object.assign(product, dto);

    if (imageUrl) {
      product.imageUrl = imageUrl;
    }

    return this.productsRepo.save(product);
  }

  async remove(id: number) {
    const product = await this.productsRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Sản phẩm không tồn tại');

    // 👇 soft delete
    product.isActive = false;
    await this.productsRepo.save(product);

    return { success: true };
  }

}
