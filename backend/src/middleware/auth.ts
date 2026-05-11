import jwt, { JwtPayload } from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";

const ACCESS_SECRET=process.env.JWT_SECRET!;
const REFRESH_SECRET=process.env.JWT_REFRESH_SECRET!;

export interface AppJwtPayload extends JwtPayload{
  role: "admin" | "user";
}

export interface AuthRequest extends Request{
  user?: JwtPayload
}

//Generates a new access token
export function generate_token(payload: Omit<AppJwtPayload, "iat" | "exp">): string {

    return jwt.sign(payload, ACCESS_SECRET, {expiresIn: "15m"});
}

//Genereates a new refresh token
export function generate_refresh_token(payload: Omit<AppJwtPayload, "iat" | "exp">): string {

    return jwt.sign(payload, REFRESH_SECRET, {expiresIn: "7d"});
}

//Extracts access token from request headers
function extract_token(req: Request):string | null{

  const auth=req.headers.authorization;

  if(auth?.startsWith("Bearer ")){ 
    return auth.slice(7); 
  }

  return null;
}

//Verifies access token for authentication
export function verify_token(req: AuthRequest, res: Response, next: NextFunction) {

  const token=extract_token(req);

  if(!token){
    res.status(401).json({error:"UNAUTHORIZED", messsage: "No token provided"});
    return;
  }

  try{

    req.user=jwt.verify(token, ACCESS_SECRET) as AppJwtPayload;
    next();

  }catch(err){

    let error;
    let message;
    
    if(err instanceof jwt.TokenExpiredError){
      error="TOKEN_EXPIRED";
      message="Token expired";
    }else{

      error="UNAUTHORIZED";
      message="Invalid Token";
    }

    res.status(401).json({error, message});
  }
}

//Refreshes access token when it expires and refresh token is still valid
export function refresh_token(req: AuthRequest, res: Response){

  const token=req.body?.refresh_token as string | undefined;

  if(!token){

    res.status(422).json({error : "MISSING_FIELDS", message : "Missing refresh token"});
    return;
  }

  try{
    const payload=jwt.verify(token, REFRESH_SECRET) as AppJwtPayload;

    const new_access_token=generate_token(payload);

    res.status(200).json({token: new_access_token});
  } catch{

    res.status(401).json({error : "UNAUTHORIZED", message: "Invalid refresh token"});
  }
}
