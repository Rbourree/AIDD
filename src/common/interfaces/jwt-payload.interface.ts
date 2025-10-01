export interface JwtPayload {
  sub: string;
  tenantId: string;
  iat?: number;
  exp?: number;
}
