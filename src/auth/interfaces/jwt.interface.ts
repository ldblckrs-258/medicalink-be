export interface JwtRefreshPayloadType {
  sessionId: string;
  iat: number;
  exp: number;
}

export interface JwtPayloadType {
  id: string;
  email: string;
  role: string;
  sessionId: string;
  iat: number;
  exp: number;
}
