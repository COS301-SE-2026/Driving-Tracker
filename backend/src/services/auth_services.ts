import prisma from '../db/prisma';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendAuthEmail } from '../utils/email';
import { generate_refresh_token, generate_token } from '../middleware/auth';
import {z} from "zod";
import { ValidationError, ConflictError, ExtendedError } from '../utils/errors';
import { AppJwtPayload } from '../middleware/auth';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';

const REFRESH_SECRET=process.env.JWT_REFRESH_SECRET!;

const email_schema=z.email("Invalid email address");

const password_schema=z.string().min(8).max(20)
.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
.regex(/[0-9]/, "Password must contain at least one number")
.regex(/[^a-zA-Z0-9]/, "Password must contain att least one special character");

const username_schema=z.string().min(3, "Username must have atleast 3 characters").max(50,"Username can have atmost 50 characters");

const name_schema=z.string().min(1, "Name/Surname must have atleast 1 character").max(50, "Name/Surname can have atmost 50 characters");

const phone_schema=z.string().regex(/^0\d{9}$/, "Invalid phone number. Should be 0603456789 format");

const dob_schema = z.preprocess(val => {
  if (typeof val !== 'string') return val;

  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return new Date(val + 'T00:00:00Z');

  if (/^\d{4}\/\d{2}\/\d{2}$/.test(val)) {
    const [y,m,d] = val.split('/').map(Number);
    return new Date(Date.UTC(y, m-1, d));
  }

  return val;
}, z.date().refine(d => {
  const e = new Date(d); e.setFullYear(e.getFullYear()+18);
  return e <= new Date();
}, { message: 'You must be 18 or older' }));

function validate_email(email: string){
    return email_schema.safeParse(email);
}

function validate_password(password: string){
    return password_schema.safeParse(password);
}

async function generate_unique_username(name: string, surname: string) {
  const base = `${name}${surname}`
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 12);

    const suffix = Math.floor(10000 + Math.random() * 90000);
    const username = `${base}${suffix}`;

    return username;
  }

export const auth_services = {

    async register (email: string, username: string, name: string, surname:string, password: string, phone_number: string, dob: string, consent_status: boolean)
    :Promise<{user: any, refresh_token: string}>{
        //validating all parameters
        if(!consent_status) throw new ValidationError("You must accept the terms to register", "consent_status");

        const username_result=username_schema.safeParse(username);
        
        if(!username_result.success){
            throw new ValidationError(username_result.error.issues.at(0)?.message!,"username");
        }

        const name_result=name_schema.safeParse(name);
        
        if(!name_result.success){
            throw new ValidationError(name_result.error.issues.at(0)?.message!,"name");
        }

        const surname_result=name_schema.safeParse(surname);
        
        if(!surname_result.success){
            throw new ValidationError(surname_result.error.issues.at(0)?.message!,"surname")
        }

        const phone_result=phone_schema.safeParse(phone_number);

        if(!phone_result.success){
            throw new ValidationError(phone_result.error.issues.at(0)?.message!,"phone")
        }

        const normalized_email = email.trim().toLowerCase();

        const email_result=validate_email(normalized_email);
        
        if(!email_result.success){
            throw new ValidationError(email_result.error.issues.at(0)?.message!,"email")
        }

        const dob_result=dob_schema.safeParse(dob);

        if(!dob_result.success){
            throw new ValidationError(dob_result.error.issues.at(0)?.message!,"dob")
        }

        const dob_date=dob_result.data;

        //Checking if user with email already exists
        const existing_user=await prisma.users.findFirst({
            where: { email: normalized_email }
        });

        if(existing_user){

            if(existing_user.email === normalized_email){

                throw new ConflictError("You already have an account with this email address","email");
            }
        }

        const password_result=validate_password(password);

         if(!password_result.success){
            throw new ValidationError(password_result.error.issues.at(0)?.message!,"password")
        }
        //password hashing with bcrypt
        const hashedPassword=await bcrypt.hash(password,10);

        let usernameLocal = username;

        const verificationToken = crypto.randomBytes(32).toString('hex');

        const maxAttempts = 3;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                const user = await prisma.users.create({
                data: {
                    email: normalized_email,
                    username: usernameLocal,
                    name,
                    surname,
                    dob: dob_date,
                    phone_number,
                    password_hash: hashedPassword,
                    consent_status: consent_status,
                    email_verified: false,
                    verification_token: verificationToken
                    }
                });


                //generating refresh token
                const refresh_token=generate_refresh_token({ sub:user.user_id, role:user.role});

                await prisma.users.update({
                    where: {user_id: user.user_id}, 
                    data: {
                        refresh_token, 
                        refresh_token_exp: new Date(Date.now() +7*24*60*60*1000),
                    },
                });

                const verificationUrl = `${process.env.APP_URL}/api/auth/verify?token=${verificationToken}`;
                await sendAuthEmail(
                    email,
                    "Verify your Driving Tracker Account",
                    `<h1>Welcome to Driving Tracker!</h1>
                    <p>Please click the link below to verify your email address and activate your account:</p>
                    <a href="${verificationUrl}" style="background: #2D8CFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
                    <p>If you did not create this account, you may safely ignore this email.</p>`
                );

                return {user, refresh_token};
            
            } catch (err: any) {
                if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
                    
                    usernameLocal = await generate_unique_username(name, surname);
                    if (attempt === maxAttempts - 1) throw new ConflictError('Username already taken', 'username');
                    continue; 
                }

                throw err;
            }
        }

        throw new ExtendedError("Failed to register user", "INTERNAL_SERVER_ERROR");
        
    },

    async verify_email(token: string){
        const user = await prisma.users.findFirst({
            where: {
                verification_token: token
            }
        });

        if(!user) throw new Error("INVALID_OR_EXPIRED_TOKEN");

        await prisma.users.update({
            where: {user_id: user.user_id },
            data: {
                email_verified: true,
                verification_token: null
            }
        });
    },

    async request_password_reset(email: string){
        const user = await prisma.users.findUnique({
            where:  {email }
        });
        if(!user) return;

        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 3600000);

        await prisma.users.update({
            where: { email },
            data: {
                password_reset_token: resetToken,
                reset_token_exp: expiry
            }
        });

        const resetUrl = `drivingtracker://reset-password?token=${resetToken}`;

        await sendAuthEmail(
            email,
            "Reset your Driving Tracker Password",
            `<h1>Password Reset Request</h1>
            <p>We received a request to reset your password. Use the token below in the app or click the link:</p>
            <p><strong>Your Reset Token:</strong> ${resetToken}</p>
            <a href="${resetUrl}" style="background: #4B2E83; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p>This link will expire in 1 hour.</p>`

        );
    },

    async reset_password(token: string, newPassword: string){
        const user = await prisma.users.findFirst({
            where: {
                password_reset_token: token,
                refresh_token_exp: {
                    gt: new Date()
                }
            }
        });

        if(!user) throw new Error("INVALID_OR_EXPIRED_TOKEN");

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.users.update({
            where: { user_id: user.user_id },
            data: {
                password_hash: hashedPassword,
                password_reset_token: null,
                refresh_token_exp: null
            }
        })
    },

    async login(identifier: string, password: string){

        const normalized = identifier.trim().toLowerCase();

        const user= await prisma.users.findFirst({where: {
            OR:[
                {email: normalized},
                {username: identifier}
            ]
        }});

        if(!user) throw new ValidationError("Incorrect username/email", "credentials");

        const valid=await bcrypt.compare(password, user.password_hash);

        if(!valid) throw new ValidationError("Password incorrect","password");

        const refresh_token=generate_refresh_token({ sub:user.user_id, role:user.role});

        await prisma.users.update({
            where: {user_id: user.user_id}, 
            data: {
                refresh_token, 
                refresh_token_exp: new Date(Date.now() +7*24*60*60*1000),
            },
        });

        return {user, refresh_token};
    },

    async logout(user_id:string){

        await prisma.users.update({
            where: {user_id: user_id}, 
            data: {
                refresh_token: null, 
                refresh_token_exp: null,
            },
        });
    },
    async refresh(token: string){

        const payload=jwt.verify(token, REFRESH_SECRET) as AppJwtPayload;

        //find user associated with token
        const user= await prisma.users.findFirst({

            where: {
                user_id: payload.sub!,
                refresh_token: token,
                refresh_token_exp: { gt: new Date() }
            },
        });

        if(!user) throw new ExtendedError("Invalid refresh token", "UNAUTHORIZED");

        //generatte new refresh token
        const new_refresh_token=generate_refresh_token({sub: user.user_id, role: user.role});

        //rotate refresh token
        await prisma.users.update({
            where: { user_id: user.user_id},
            data: {
                refresh_token: new_refresh_token,
                refresh_token_exp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            },
        });

        return {user, new_refresh_token};
    },

    async get_profile(user_id: string){
        const user = await prisma.users.findUnique({
            where: { user_id },
            select: {
                user_id: true,
                username: true,
                name: true,
                surname: true,
                email: true,
                phone_number: true,
                dob: true,
                _count: {
                    select: {
                        trips: true,
                        user_badges: true,
                        users_vehicles: true,
                    }
                }
            }
        });

        if(!user) throw new Error('User not found');

        return {
            user_id: user.user_id,
            username: user.username,
            name: user.name,
            surname: user.surname,
            email: user.email,
            phone_number: user.phone_number,
            dob: user.dob,
            trip_count: user._count.trips,
            badge_count: user._count.user_badges,
            vehicle_count: user._count.users_vehicles,
        }
    }
};

