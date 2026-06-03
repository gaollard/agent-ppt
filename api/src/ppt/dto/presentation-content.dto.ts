import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { SLIDE_LAYOUTS } from '../../ai/types/slide-content';

class ThemeDto {
  @IsOptional() @IsString() primary?: string;
  @IsOptional() @IsString() accent?: string;
  @IsOptional() @IsString() background?: string;
  @IsOptional() @IsString() text?: string;
}

class ChartDto {
  @IsIn(['bar', 'line', 'pie']) type!: 'bar' | 'line' | 'pie';
  @IsArray() @IsString({ each: true }) labels!: string[];
  @IsArray() @IsNumber({}, { each: true }) values!: number[];
}

class ColumnDto {
  @IsString() title!: string;
  @IsArray() @IsString({ each: true }) bullets!: string[];
}

class ElementStyleDto {
  @IsOptional() @IsNumber() fontSize?: number;
  @IsOptional() @IsIn(['normal', 'bold']) fontWeight?: 'normal' | 'bold';
  @IsOptional() @IsString() color?: string;
  @IsOptional() @IsIn(['left', 'center', 'right']) align?: 'left' | 'center' | 'right';
  @IsOptional() @IsBoolean() bullets?: boolean;
  @IsOptional() @IsString() background?: string;
}

class SlideElementDto {
  @IsString() id!: string;
  @IsIn(['text', 'image']) type!: 'text' | 'image';
  @IsNumber() x!: number;
  @IsNumber() y!: number;
  @IsNumber() w!: number;
  @IsNumber() h!: number;
  @IsOptional() @IsString() content?: string;
  @IsOptional() @ValidateNested() @Type(() => ElementStyleDto) style?: ElementStyleDto;
  @IsOptional() @IsString() imagePath?: string;
  @IsOptional() @IsNumber() zIndex?: number;
}

class SlideDto {
  @IsString() @MinLength(1) title!: string;
  @IsArray() @IsString({ each: true }) bullets!: string[];
  @IsOptional() @IsIn(SLIDE_LAYOUTS) layout?: string;
  @IsOptional() @IsString() imagePrompt?: string;
  @IsOptional() @IsString() imagePath?: string;
  @IsOptional() @ValidateNested() @Type(() => ColumnDto) columnB?: ColumnDto;
  @IsOptional() @ValidateNested() @Type(() => ChartDto) chart?: ChartDto;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SlideElementDto)
  elements?: SlideElementDto[];
}

export class PresentationContentDto {
  @IsString() @MinLength(1) title!: string;
  @IsOptional() @ValidateNested() @Type(() => ThemeDto) theme?: ThemeDto;
  @IsArray() @ValidateNested({ each: true }) @Type(() => SlideDto) slides!: SlideDto[];
}
