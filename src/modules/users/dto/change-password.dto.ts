import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword } from '../../../common/validators/is-strong-password.validator';

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description:
      'Must be at least 8 characters and contain uppercase, lowercase, number, and special character',
    example: 'NewPassword123!',
  })
  @IsString()
  @IsStrongPassword()
  newPassword: string;
}
