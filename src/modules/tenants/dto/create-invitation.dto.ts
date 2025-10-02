import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TenantRole } from '@modules/tenants/enums/tenant-role.enum';

export class CreateInvitationDto {
  @ApiProperty({ example: 'newuser@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ enum: TenantRole, default: TenantRole.MEMBER })
  @IsOptional()
  @IsEnum(TenantRole)
  role?: TenantRole = TenantRole.MEMBER;
}
