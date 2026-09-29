import prisma from '../db/prisma';
import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { sendAuthEmail } from '../utils/email';
import { generate_refresh_token, AppJwtPayload } from '../middleware/auth';
import {z} from "zod";
import { ValidationError, ConflictError, ExtendedError } from '../utils/errors';
import jwt from 'jsonwebtoken';
import { OrganizationRole, Prisma } from '@prisma/client';
import { fleet_services } from './fleet_services';

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

type DbClient = Prisma.TransactionClient | typeof prisma;

async function generate_unique_username(name: string, surname: string, tx: DbClient = prisma): Promise<string> {
  const base = `${name}${surname}`
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 12) || "user";

    const candidates = Array.from(
        { length: 5 },
        () => `${base}${crypto.randomInt(10000, 100000)}`
    );

    const taken = await tx.users.findMany({
        where: { username: { in: candidates }},
        select: { username: true },
    });

    const taken_set = new Set(taken.map((u)=> u.username));

    const free = candidates.find((c)=> !taken_set.has(c));

    if(free) return free;

    return `${base}${crypto.randomBytes(4).toString("hex")}`;

  }

type CreateUserParams = {
     email: string;
     username?: string;
     name: string;
     surname:string;
     phone_number: string;
     dob: string;
     consent_status: boolean;
     password?: string;
};

async function resolve_username(
    params: Pick<CreateUserParams, "username" | "name" | "surname">,
    tx: DbClient
): Promise<string> {

    if(params.username) {
        const result = username_schema.safeParse(params.username);

        if(!result.success) {
            throw new ValidationError(result.error.issues[0]?.message ?? "Invalid username", "username");
        }

        const taken = await tx.users.findFirst({
            where: { username: params.username },
            select: { user_id: true },
        });

        if(!taken) return params.username;
    }

    return generate_unique_username(params.name, params.surname, tx);
}

async function send_verification_email(email: string, token: string){
    const verificationUrl = `${process.env.APP_URL}/api/auth/verify_email?token=${token}`;
    
    await sendAuthEmail(
        email,
        "Verify your Driving Tracker Account",
        `<h1>Welcome to Driving Tracker!</h1>
        <p>Please click the link below to verify your email address and activate your account:</p>
        <a href="${verificationUrl}" style="background: #2D8CFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>If you did not create this account, you may safely ignore this email.</p>`
    );
}

async function create_user_account(params: CreateUserParams, tx: Prisma.TransactionClient | typeof prisma = prisma){

    if(!params.consent_status) throw new ValidationError("You must accept the terms to register", "consent_status");

    const username_result=username_schema.safeParse(params.username);
    
    if(!username_result.success){
        throw new ValidationError(username_result.error.issues.at(0)?.message!,"username");
    }

    const name_result=name_schema.safeParse(params.name);
    
    if(!name_result.success){
        throw new ValidationError(name_result.error.issues.at(0)?.message!,"name");
    }

    const surname_result=name_schema.safeParse(params.surname);
    
    if(!surname_result.success){
        throw new ValidationError(surname_result.error.issues.at(0)?.message!,"surname")
    }

    const phone_result=phone_schema.safeParse(params.phone_number);

    if(!phone_result.success){
        throw new ValidationError(phone_result.error.issues.at(0)?.message!,"phone")
    }

    const email_result=validate_email(params.email);
    
    if(!email_result.success){
        throw new ValidationError(email_result.error.issues.at(0)?.message!,"email")
    }

    const dob_result=dob_schema.safeParse(params.dob);

    if(!dob_result.success){
        throw new ValidationError(dob_result.error.issues.at(0)?.message!,"dob")
    }

    const dob_date=dob_result.data;

    const existing_user=await tx.users.findFirst({
            where: { email: params.email },
            select: { user_id: true },
        });

    if(existing_user){
        throw new ConflictError("You already have an account with this email address","email");
    }

    const hashedPassword = params.password 
        ? await bcrypt.hash(params.password, 10)
        : await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);

    
    const username = await resolve_username(params, tx);

    const verificationToken = crypto.randomBytes(32).toString('hex');

    try {
        const user = await tx.users.create({
        data: {
                email: params.email,
                username,
                name: params.name,
                surname: params.surname,
                dob: dob_date,
                phone_number: params.phone_number,
                password_hash: hashedPassword,
                consent_status: params.consent_status,
                email_verified: params.email.startsWith('loadtest_') && process.env.NODE_ENV !== "production",
                verification_token: verificationToken
            }
        });

        return {user, verificationToken};
    
    } catch (err: any) {
        /* istanbul ignore next */
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
            const target = err.meta?.target;
            const fields = Array.isArray(target)? target: [String(target ?? "")];

            if(fields.some((f)=> f.includes("email"))){
                throw new ConflictError("You already have an account with this email address", "email");
            }

            throw new ConflictError("Something went wrong creating your account, please try again", "username");
        }
        throw err;
    }
}

export const auth_services = {

    async register (email: string, username: string, name: string, surname:string, password: string, phone_number: string, dob: string, consent_status: boolean)
    :Promise<{user: any}>{
        //validating all parameters

        const password_result=validate_password(password);

         if(!password_result.success){
            throw new ValidationError(password_result.error.issues.at(0)?.message ?? "Invalid password","password")
        }

        const normalized_email = email.trim().toLowerCase();

        const { user, verificationToken } = await create_user_account({
            email: normalized_email, username, name, surname, phone_number, dob, consent_status, password,
        });

        send_verification_email(normalized_email, verificationToken);

        return { user };
        
    },

    async dashboard_register (register_data: { email: string, username: string, name: string, surname:string, password: string, phone_number: string, dob: string, consent_status: boolean }, organization_name: string)
    :Promise<{user: any}>{


        const org_name = organization_name?.trim();

        if(!org_name){
            throw new ValidationError("Organization name cannot be empty", "organization_name");
        }

        const password_result=validate_password(register_data.password);
        if(!password_result.success){
            throw new ValidationError(password_result.error.issues.at(0)?.message ?? "Invalid password","password")
        }

        const normalized_email = register_data.email.trim().toLowerCase();

        const { user, verificationToken } = await prisma.$transaction( async (tx) => {

            const { user, verificationToken } = await create_user_account({
                ...register_data,
                email: normalized_email,
            }, tx);

            const organization = await tx.organizations.create({
                data: {
                    name: org_name,
                },
            });

            await tx.organization_members.create({
                data:{
                    org_id: organization.org_id,
                    user_id: user.user_id,
                    role: OrganizationRole.ADMIN
                },
            });

            return { user, verificationToken }

        });

        send_verification_email(normalized_email, verificationToken);

        return { user };
        
    },

    async add_driver_to_org(manager_user_id: string, org_id: string, driver_data: {
        email: string;
        username: string;
        name: string;
        surname:string;
        phone_number: string;
        dob: string;
    }){

        const manager = await prisma.organization_members.findUnique({
            where: { 
                org_id_user_id: {
                    org_id, user_id: manager_user_id,
                }
            },
            select: {
                role: true,
                organizations:{
                    select: { name: true },
                },
            },
        });

        if(!manager || !(manager.role == OrganizationRole.MANAGER || manager.role == OrganizationRole.ADMIN)){
            throw new ExtendedError("Not authorized to add drivers", "UNAUTHORIZED");
        }

        const { email, ...data } = driver_data;

        const normalized_email = email.trim().toLowerCase();

        return await prisma.$transaction(async (tx) => {

            const { user } = await create_user_account({
                email: normalized_email,
                ...data,
                consent_status: true
            });

            await tx.organization_members.create({
                data: { org_id, user_id: user.user_id, role: OrganizationRole.DRIVER },
            });

            const resetToken = crypto.randomBytes(32).toString('hex');
            await tx.users.update({
                where: { user_id: user.user_id },
                data: {
                    verification_token: null,
                    password_reset_token: resetToken,
                    reset_token_exp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            });

            return { user, resetToken };

        }).then(async ({ user, resetToken }) => {

            const setupUrl = `${process.env.APP_URL}/api/auth/reset_password_link?token=${encodeURIComponent(resetToken)}`;

            await sendAuthEmail(
                normalized_email,
                `Setup your Driving Tracker account for ${manager.organizations.name}`,
                `<h1>Welcome!</h1>
                <p>You've been added to ${manager.organizations.name} as a driver. Click below to set your account password</p>
                <a href="${setupUrl}" style="background: #2D8CFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Set Password</a>
                <p>This link will expire in 7 days.</p>`
            );

            return { user };
        });

    },

    async verify_email(token: string){
        if(!token || typeof token !== "string"){
            throw new ValidationError("Verification token is required", "token");
        }
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
        const normalized_email = (email ?? "").trim().toLowerCase();

        const email_result = validate_email(normalized_email);
        if(!email_result.success){
            return;
        }

        const user = await prisma.users.findUnique({
            where:  { email: normalized_email }
        });

        if(!user) return;

        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 3600000);

        await prisma.users.update({
            where: { email: normalized_email },
            data: {
                password_reset_token: resetToken,
                reset_token_exp: expiry
            }
        });

        const resetUrl = `${process.env.APP_URL}/api/auth/reset_password_link?token=${encodeURIComponent(resetToken)}`;

        await sendAuthEmail(
            email,
            "Reset your Driving Tracker Password",
            `<h1>Password Reset Request</h1>
            <p>We received a request to reset your password. Click the button to reset your password:</p>
            <a href="${resetUrl}" style="background: #2D8CFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p>This link will expire in 1 hour.</p>`
        );
    },

    async reset_password(token: string, newPassword: string){
        if(!token || typeof token !== "string"){
            throw new ValidationError("Reset token is required", "token");
        }

        const password_result = validate_password(newPassword);
        if(!password_result.success){
            throw new ValidationError(password_result.error.issues.at(0)?.message!, "password");
        }

        const user = await prisma.users.findFirst({
            where: {
                password_reset_token: token,
                reset_token_exp: {
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
                reset_token_exp: null,
                refresh_token: null,
                refresh_token_exp: null,
                email_verified: true,
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

		if(!user.email_verified){
			throw new ExtendedError("Please verify your email address before logging in.", "EMAIL_NOT_VERIFIED");
		}

        const valid=await bcrypt.compare(password, user.password_hash);

        if(!valid) throw new ValidationError("Password incorrect","password");

        const user_org = await prisma.organization_members.findUnique({
            where: {
                user_id: user.user_id
            },
        });

        const refresh_token=generate_refresh_token({ sub:user.user_id, role:user.role, 
            org_id: user_org?.org_id ?? null, org_role: user_org?.role ?? null });

        await prisma.users.update({
            where: {user_id: user.user_id}, 
            data: {
                refresh_token, 
                refresh_token_exp: new Date(Date.now() +7*24*60*60*1000),
            },
        });

        return {user, refresh_token, user_org};
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

         const user_org = await prisma.organization_members.findUnique({
            where: {
                user_id: user.user_id
            },
        });

        //generatte new refresh token
        const new_refresh_token=generate_refresh_token({ sub:user.user_id, role:user.role, 
            org_id: user_org?.org_id ?? null, org_role: user_org?.role ?? null });

        //rotate refresh token
        await prisma.users.update({
            where: { user_id: user.user_id},
            data: {
                refresh_token: new_refresh_token,
                refresh_token_exp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            },
        });

        return {user, new_refresh_token, user_org};
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
                profile_picture_url: true,
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
            profile_picture_url: user.profile_picture_url ? `upload/profile-picture/${user.user_id}` : null,
            trip_count: user._count.trips,
            badge_count: user._count.user_badges,
            vehicle_count: user._count.users_vehicles,
        }
    },

    async update_profile_picture(user_id: string, blob_name: string){
        const existing = await prisma.users.findUnique({
            where: { user_id },
            select: { profile_picture_url: true }
        });

        if(!existing) throw new ExtendedError("User not found", "USER_NOT_FOUND");

        const updatedUser = await prisma.users.update({
            where: { user_id },
            data: { profile_picture_url: blob_name, },
            select: {profile_picture_url: true ,}
        });

        return {
            display_url: `upload/profile-picture/${user_id}`,
            previous_blob_name: existing.profile_picture_url,
            updated_blob_name: updatedUser.profile_picture_url,
        };
    },

    async get_profile_picture_blob_name(user_id: string): Promise<string | null> {
        const user = await prisma.users.findUnique({
            where: { user_id },
            select: { profile_picture_url: true }
        });

        if(!user) throw new ExtendedError("User not found", "USER_NOT_FOUND");

        return user.profile_picture_url;
    }
};

