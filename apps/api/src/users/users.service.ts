import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
  ) {}

  findById(id: string) {
    return this.repo.findOneBy({ id });
  }

  findByEmail(email: string) {
    return this.repo.findOneBy({ email });
  }

  async searchByEmail(
    email: string,
  ): Promise<Pick<User, 'id' | 'email' | 'name'>[]> {
    return this.repo
      .createQueryBuilder('u')
      .select(['u.id', 'u.email', 'u.name'])
      .where('u.email ILIKE :email', { email: `%${email}%` })
      .limit(10)
      .getMany();
  }

  async create(
    email: string,
    passwordHash: string,
    name: string,
  ): Promise<User> {
    const existing = await this.findByEmail(email);
    if (existing) throw new ConflictException('Email already in use');
    const user = this.repo.create({ email, passwordHash, name });
    return this.repo.save(user);
  }
}
