import { IsString, IsNotEmpty } from 'class-validator';

export class CreateHumanizationJobDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  inputText: string;
}
