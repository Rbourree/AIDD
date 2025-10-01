import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateItemDto {
  @ApiProperty({ description: 'Name of the item', example: 'Sample Item' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the item',
    example: 'This is a sample item description',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
