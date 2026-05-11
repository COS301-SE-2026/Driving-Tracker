import prisma from '../db/prisma';
import bcrypt from 'bcrypt';
import { generate_refresh_token } from '../middleware/auth';

export const auth_services = {

    async register (email: string, username: string, name:string, surname:string, password: string){

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
    }

};