import prisma from '../db/prisma';
import bcrypt from 'bcrypt';
import { generate_refresh_token } from '../middleware/auth';
import {z} from "zod";

const email_schema=z.email("Invalid email address")

const password_schema=z.string().min(8).max(20)
.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
.regex(/[0-9]/, "Password must contain at least one number")
.regex(/[^a-zA-Z0-9]/, "Password must contain att least one special character");

const username_schema=z.string().min(3, "Username must have atleast 3 characters").max(50,"Username can have atmost 50 characters");

const name_schema=z.string().min(1, "Name/Surname must have atleast 1 character").max(50, "Name/Surname can have atmost 50 characters");

function validate_email(email: string){
    return email_schema.safeParse(email);
}

function validate_password(password: string){
    return password_schema.safeParse(password);
}

export const auth_services = {

    async register (email: string, username: string, name:string, surname:string, password: string, consent_status: boolean){

        if(!consent_status) throw new Error("You must accept the terms to register");

        const username_result=username_schema.safeParse(username);
        
        if(!username_result.success){
            throw new Error(username_result.error.message)
        }

        const name_result=name_schema.safeParse(name);
        
        if(!name_result.success){
            throw new Error(name_result.error.message)
        }

        const surname_result=name_schema.safeParse(surname);
        
        if(!surname_result.success){
            throw new Error(surname_result.error.message)
        }


        const email_result=validate_email(email);
        
        if(!email_result.success){
            throw new Error(email_result.error.message)
        }

        const password_result=validate_password(password);

         if(!password_result.success){
            throw new Error(password_result.error.message)
        }

        const hashedPassword=await bcrypt.hash(password,10);
        const user=await prisma.users.create({

            data: {
                email, 
                username,
                name,
                surname,
                password_hash:hashedPassword
            }
        });

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

    async login(identifier: string, password: string){

        const user= await prisma.users.findFirst({where: {
            OR:[
                {email: identifier},
                {username: identifier}
            ]
        }});

        if(!user) throw new Error("Invalid credentials");

        const valid=await bcrypt.compare(password, user.password_hash);

        if(!valid) throw new Error("Invalid credentials");

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

};

