import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TenantRole } from '@prisma/client';

export class AddUserToTenantDto {
  @ApiProperty({
    description: 'The ID of the user to add to the tenant',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'The role to assign to the user in the tenant',
    enum: TenantRole,
    example: TenantRole.MEMBER,
  })
  @IsEnum(TenantRole)
  @IsNotEmpty()
  role: TenantRole;
}
