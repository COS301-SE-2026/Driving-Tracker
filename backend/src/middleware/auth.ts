import jwt, { JwtPayload } from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";

export function verify_token(req: Request, res: Response, next: NextFunction) {
  // Implementation here
}