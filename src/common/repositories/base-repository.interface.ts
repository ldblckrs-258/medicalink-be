export interface BaseRepository<
  T,
  _CreateInput,
  _UpdateInput,
  WhereUniqueInput,
> {
  create(data: any): Promise<T>;
  findUnique(where: WhereUniqueInput): Promise<T | null>;
  findMany(options?: {
    where?: any;
    include?: any;
    orderBy?: any;
    skip?: number;
    take?: number;
  }): Promise<T[]>;
  update(where: WhereUniqueInput, data: any): Promise<T>;
  delete(where: WhereUniqueInput): Promise<T>;
  count(where?: any): Promise<number>;

  softDelete?(where: WhereUniqueInput): Promise<T>;
  restore?(where: WhereUniqueInput): Promise<T>;
  findManyWithDeleted?(options?: {
    where?: any;
    include?: any;
    orderBy?: any;
    skip?: number;
    take?: number;
  }): Promise<T[]>;
}
