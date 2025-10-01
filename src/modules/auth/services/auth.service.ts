import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import { UserRepository } from '../../users/repositories/user.repository';
import { TenantRepository } from '../../tenants/repositories/tenant.repository';
import { InvitationRepository } from '../../tenants/repositories/invitation.repository';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { UserMapper } from '../../users/mappers/user.mapper';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { AcceptInvitationDto } from '../dto/accept-invitation.dto';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import {
  AuthInvalidCredentialsException,
  AuthUserHasNoTenantsException,
  AuthInvalidRefreshTokenException,
  AuthUserAlreadyExistsException,
  AuthPasswordRequiredException,
  AuthTenantNotFoundException,
} from '../exceptions/auth.exceptions';
import {
  InvitationNotFoundException,
  InvitationAlreadyAcceptedException,
  InvitationExpiredException,
} from '../../tenants/exceptions/invitation.exceptions';
import * as bcrypt from 'bcrypt';
import { TenantRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userRepository: UserRepository,
    private readonly tenantRepository: TenantRepository,
    private readonly invitationRepository: InvitationRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findByEmail(registerDto.email);

    if (existingUser) {
      throw new AuthUserAlreadyExistsException(registerDto.email);
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    let activeTenantId: string;

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: registerDto.email,
          password: hashedPassword,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
        },
      });

      if (registerDto.tenantId) {
        const tenant = await tx.tenant.findUnique({
          where: { id: registerDto.tenantId },
        });

        if (!tenant) {
          throw new AuthTenantNotFoundException(registerDto.tenantId);
        }

        await tx.tenantUser.create({
          data: {
            userId: newUser.id,
            tenantId: registerDto.tenantId,
            role: TenantRole.MEMBER,
          },
        });

        activeTenantId = registerDto.tenantId;
      } else {
        const slug = this.generateSlug(registerDto.email);
        const tenant = await tx.tenant.create({
          data: {
            name: `${registerDto.firstName || 'User'}'s Workspace`,
            slug,
          },
        });

        await tx.tenantUser.create({
          data: {
            userId: newUser.id,
            tenantId: tenant.id,
            role: TenantRole.OWNER,
          },
        });

        activeTenantId = tenant.id;
      }

      return newUser;
    });

    const tokens = await this.generateTokens(user.id, activeTenantId);

    return {
      user: UserMapper.excludePassword(user),
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findByEmailWithPassword(loginDto.email);

    if (!user) {
      throw new AuthInvalidCredentialsException();
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new AuthInvalidCredentialsException();
    }

    const tenantUsers = await this.prisma.tenantUser.findMany({
      where: { userId: user.id },
    });

    if (tenantUsers.length === 0) {
      throw new AuthUserHasNoTenantsException();
    }

    // Use the first tenant as the active tenant
    const activeTenantId = tenantUsers[0].tenantId;

    const tokens = await this.generateTokens(user.id, activeTenantId);

    return {
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      // Verify JWT signature and expiration
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('jwt.refreshSecret'),
      });

      // Check if token exists in database and is not revoked
      const storedToken = await this.refreshTokenRepository.findByToken(refreshToken);

      if (!storedToken || !storedToken.isValid()) {
        throw new AuthInvalidRefreshTokenException();
      }

      const user = await this.userRepository.findById(payload.sub);

      if (!user) {
        throw new AuthInvalidRefreshTokenException();
      }

      // Preserve the tenantId from the existing token
      const tokens = await this.generateTokens(user.id, payload.tenantId);

      return tokens;
    } catch (error) {
      throw new AuthInvalidRefreshTokenException();
    }
  }

  async logout(refreshToken: string): Promise<{ message: string }> {
    try {
      await this.refreshTokenRepository.revoke(refreshToken);
      return { message: 'Logged out successfully' };
    } catch (error) {
      // Even if revocation fails, return success to prevent info leakage
      return { message: 'Logged out successfully' };
    }
  }

  async acceptInvitation(acceptInvitationDto: AcceptInvitationDto) {
    const invitation = await this.invitationRepository.findByToken(acceptInvitationDto.token);

    if (!invitation) {
      throw new InvitationNotFoundException(acceptInvitationDto.token);
    }

    if (invitation.accepted) {
      throw new InvitationAlreadyAcceptedException();
    }

    if (invitation.isExpired()) {
      throw new InvitationExpiredException();
    }

    let user = await this.userRepository.findByEmailWithPassword(invitation.email);

    if (!user) {
      if (!acceptInvitationDto.password) {
        throw new AuthPasswordRequiredException();
      }

      const hashedPassword = await bcrypt.hash(acceptInvitationDto.password, 12);

      user = await this.prisma.user.create({
        data: {
          email: invitation.email,
          password: hashedPassword,
        },
      });
    }

    await this.prisma.$transaction([
      this.prisma.tenantUser.upsert({
        where: {
          userId_tenantId: {
            userId: user.id,
            tenantId: invitation.tenantId,
          },
        },
        update: {
          role: invitation.role,
        },
        create: {
          userId: user.id,
          tenantId: invitation.tenantId,
          role: invitation.role,
        },
      }),
      this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { accepted: true },
      }),
    ]);

    // Use the invitation's tenantId as the active tenant
    const tokens = await this.generateTokens(user.id, invitation.tenantId);

    return {
      user: UserMapper.excludePassword(user),
      ...tokens,
    };
  }

  async generateTokens(userId: string, tenantId: string) {
    const payload: JwtPayload = {
      sub: userId,
      tenantId,
    };

    const refreshExpiresIn = this.configService.get('jwt.refreshExpiresIn') || '30d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.secret'),
        expiresIn: this.configService.get('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: refreshExpiresIn,
      }),
    ]);

    // Store refresh token in database with expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days default

    await this.refreshTokenRepository.create(userId, refreshToken, expiresAt);

    return {
      accessToken,
      refreshToken,
    };
  }

  private generateSlug(email: string): string {
    const base = email
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    const random = Math.random().toString(36).substring(2, 8);
    return `${base}-${random}`;
  }
}
