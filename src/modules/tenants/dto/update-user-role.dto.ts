import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TenantRole } from '@modules/tenants/enums/tenant-role.enum';

export class UpdateUserRoleDto {
  @ApiProperty({
    description: 'The new role to assign to the user',
    enum: TenantRole,
    example: TenantRole.ADMIN,
  })
  @IsEnum(TenantRole)
  @IsNotEmpty()
  role: TenantRole;
}
