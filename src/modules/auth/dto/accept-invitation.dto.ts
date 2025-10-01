import { IsString, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsStrongPassword } from '../../../common/validators/is-strong-password.validator';

export class AcceptInvitationDto {
  @ApiProperty({ description: 'Invitation token' })
  @IsUUID()
  token: string;

  @ApiPropertyOptional({
    description:
      'Password for new user (required if user does not exist). Must contain uppercase, lowercase, number, and special character',
    example: 'Password123!',
  })
  @IsOptional()
  @IsString()
  @IsStrongPassword()
  password?: string;
}
