import { Request } from 'express';
import { JwtPayloadType } from '../interfaces/jwt.interface';

export interface AuthenticatedRequest extends Request {
  user: JwtPayloadType;
}
