import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateHumanizationJobDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  inputText: string;

  @IsOptional()
  @IsString()
  readability?: string;

  @IsOptional()
  @IsString()
  tone?: string;
}
