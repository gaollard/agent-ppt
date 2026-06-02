import { IsInt, IsString, Max, Min, MinLength } from 'class-validator';

export class GeneratePptDto {
  @IsString()
  @MinLength(1)
  topic!: string;

  @IsInt()
  @Min(3)
  @Max(30)
  slideCount!: number;
}
