import { PrismaService } from 'prisma/prisma.service';
import { BaseRepository } from './base-repository.interface';
export abstract class AbstractBaseRepository<
  T,
  CreateInput,
  UpdateInput,
  WhereUniqueInput,
> implements BaseRepository<T, CreateInput, UpdateInput, WhereUniqueInput>
{
  constructor(protected readonly prisma: PrismaService) {}

  protected abstract getModel(): any;

  protected abstract toDomainEntity(raw: any): T;

  async create(data: CreateInput): Promise<T> {
    const result = await this.getModel().create({ data });
    return this.toDomainEntity(result);
  }

  async findUnique(where: WhereUniqueInput): Promise<T | null> {
    const result = await this.getModel().findUnique({ where });
    return result ? this.toDomainEntity(result) : null;
  }

  async findMany(options?: {
    where?: any;
    include?: any;
    orderBy?: any;
    skip?: number;
    take?: number;
  }): Promise<T[]> {
    const results = await this.getModel().findMany(options);
    return results.map((result: any) => this.toDomainEntity(result));
  }

  async update(where: WhereUniqueInput, data: UpdateInput): Promise<T> {
    const result = await this.getModel().update({ where, data });
    return this.toDomainEntity(result);
  }

  async delete(where: WhereUniqueInput): Promise<T> {
    const result = await this.getModel().delete({ where });
    return this.toDomainEntity(result);
  }

  async count(where?: any): Promise<number> {
    return await this.getModel().count({ where });
  }

  async softDelete(where: WhereUniqueInput): Promise<T> {
    const result = await this.getModel().update({
      where,
      data: { deletedAt: new Date() },
    });
    return this.toDomainEntity(result);
  }

  async restore(where: WhereUniqueInput): Promise<T> {
    const result = await this.getModel().update({
      where,
      data: { deletedAt: null },
    });
    return this.toDomainEntity(result);
  }

  async findManyWithDeleted(options?: {
    where?: any;
    include?: any;
    orderBy?: any;
    skip?: number;
    take?: number;
  }): Promise<T[]> {
    const results = await this.getModel().findMany({
      ...options,
      where: {
        ...options?.where,
        deletedAt: { not: null },
      },
    });
    return results.map((result: any) => this.toDomainEntity(result));
  }
}
