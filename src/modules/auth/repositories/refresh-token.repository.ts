import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import * as crypto from 'crypto';

@Injectable()
export class RefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  /**
   * Create a new refresh token record
   * Token is hashed before storage for security
   */
  async create(userId: string, token: string, expiresAt: Date): Promise<RefreshToken> {
    const hashedToken = this.hashToken(token);

    const refreshToken = this.refreshTokenRepository.create({
      userId,
      token: hashedToken,
      expiresAt,
    });

    return this.refreshTokenRepository.save(refreshToken);
  }

  /**
   * Find refresh token by hashed token value
   */
  async findByToken(token: string): Promise<RefreshToken | null> {
    const hashedToken = this.hashToken(token);

    return this.refreshTokenRepository.findOne({
      where: { token: hashedToken },
    });
  }

  /**
   * Revoke a refresh token
   */
  async revoke(token: string): Promise<void> {
    const hashedToken = this.hashToken(token);

    await this.refreshTokenRepository.update(
      { token: hashedToken },
      { revoked: true },
    );
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId },
      { revoked: true },
    );
  }

  /**
   * Delete expired tokens (cleanup job)
   */
  async deleteExpired(): Promise<number> {
    const result = await this.refreshTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });

    return result.affected || 0;
  }

  /**
   * Hash token using SHA-256
   * We store hashed tokens for security - if DB is compromised, tokens can't be used
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
