import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { AuthRequest } from "./auth";
import { Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';

const isTestEnv = process.env.NODE_ENV === 'test';

export const user_based_limiter = isTestEnv? (req: any, res: any, next: any) => next() : rateLimit({
    windowMs: 15*60*1000, //15 minutes
    max: 100, //100 requests
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: AuthRequest): string => {
        return req.user?.sub ?? (req.ip? ipKeyGenerator(req.ip): "unknown");
    },
    message: {error: "TOO_MANY_REQUESTS", message: "Too many requests, please try again later" }
});

export const trip_reading_limiter = isTestEnv? (req: any, res: any, next: any) => next() : rateLimit({
    windowMs: 60*1000, //1 minute
    max: 30, //30 requests (about 1 every 2 seconds)
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: AuthRequest): string => {
        return req.user?.sub ?? (req.ip? ipKeyGenerator(req.ip): "unknown");
    },
    message: {error: "TOO_MANY_REQUESTS", message: "Too many requests, please try again later" }
});

export const trip_event_limiter = isTestEnv? (req: any, res: any, next: any) => next() : rateLimit({
    windowMs: 60*1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: AuthRequest): string => {
        return req.user?.sub ?? (req.ip? ipKeyGenerator(req.ip): "unknown");
    },
    message: {error: "TOO_MANY_REQUESTS", message: "Too many requests, please try again later" }
});

export const map_token_limiter = isTestEnv? (req: any, res: any, next: any) => next() : rateLimit({
    windowMs: 15*60*1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: AuthRequest): string => {
        return req.user?.sub ?? (req.ip? ipKeyGenerator(req.ip): "unknown");
    },
    message: {error: "TOO_MANY_REQUESTS", message: "Too many map token requests, please try again later" }
});

export const register_fcm_token_limiter = isTestEnv? (req: any, res: any, next: any) => next() : rateLimit({
    windowMs: 15*60*1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: AuthRequest): string => {
        return req.user?.sub ?? (req.ip? ipKeyGenerator(req.ip): "unknown");
    },
    message: {error: "TOO_MANY_REQUESTS", message: "Too many fcm token requests, please try again later" }
});

export const register_limiter = isTestEnv? (req: any, res: any, next: any) => next() : rateLimit({
    windowMs: 15*60*1000,
    max: 3, //Stricter than login
    standardHeaders: true,
    legacyHeaders: false,
    message: {error: "TOO_MANY_ATTEMPTS", message: "Too many registration attempts, please try again later" }
});

export const refresh_limiter = isTestEnv? (req: any, res: any, next: any) => next() : rateLimit({
    windowMs: 15*60*1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {error: "TOO_MANY_ATTEMPTS", message: "Too many refresh attempts, please try again later" }
});

//Sliding window limiter for login, Three-tier approach

//IP + identifier combo for catching rapid credential stuffing
const strict_limiter = new RateLimiterMemory({
    points: 5,
    duration: 60 //1 minute
});

//IP for catching bots trying many accounts from one source
const ip_limiter = new RateLimiterMemory({
    points: 20,
    duration: 60
});

//identifier for catches bots rotating IP's
export const identifier_limiter = new RateLimiterMemory({
    points: 10,
    duration: 15*60 //15 minutes
});

export async function login_limiter_sliding(req: AuthRequest, res: Response, next: NextFunction) {

    //if(isTestEnv) return next();
    
    const identifier = req.body?.identifier ?? 'unknown';
    const ip = req.ip ?? 'unknown';
    const combined_key = `${identifier}_${ip}`;

    try{
        await strict_limiter.consume(combined_key);
        await ip_limiter.consume(ip);
        next();

    }catch {

        res.status(429).json({
            error: "TOO_MANY_ATTEMPTS",
            message: "Too many login attempts, please try again later"
        });
    }
    
}

export const resetIdentifierLimiter = () => {
    const snapshot = identifier_limiter.dump();

    snapshot.storage.forEach((item) => identifier_limiter.delete(item.key));
}

