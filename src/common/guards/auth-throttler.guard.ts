import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Custom throttler guard for authentication endpoints
 * Limits to 5 requests per minute to prevent brute force attacks
 */
@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Use IP address as tracker
    return req.ip || req.connection.remoteAddress;
  }

  protected async getThrottlerLimit(): Promise<number> {
    return 5; // 5 requests
  }

  protected async getThrottlerTtl(): Promise<number> {
    return 60000; // 60 seconds (1 minute)
  }
}
