import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';
import * as crypto from 'crypto';

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new refresh token record
   * Token is hashed before storage for security
   */
  async create(userId: string, token: string, expiresAt: Date): Promise<RefreshTokenEntity> {
    const hashedToken = this.hashToken(token);

    const refreshToken = await this.prisma.refreshToken.create({
      data: {
        userId,
        token: hashedToken,
        expiresAt,
      },
    });

    return new RefreshTokenEntity(refreshToken);
  }

  /**
   * Find refresh token by hashed token value
   */
  async findByToken(token: string): Promise<RefreshTokenEntity | null> {
    const hashedToken = this.hashToken(token);

    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token: hashedToken },
    });

    return refreshToken ? new RefreshTokenEntity(refreshToken) : null;
  }

  /**
   * Revoke a refresh token
   */
  async revoke(token: string): Promise<void> {
    const hashedToken = this.hashToken(token);

    await this.prisma.refreshToken.update({
      where: { token: hashedToken },
      data: { revoked: true },
    });
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });
  }

  /**
   * Delete expired tokens (cleanup job)
   */
  async deleteExpired(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }

  /**
   * Hash token using SHA-256
   * We store hashed tokens for security - if DB is compromised, tokens can't be used
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
