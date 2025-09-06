import { IsNotEmpty, IsString } from 'class-validator';

export class FileDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  path: string;
}
