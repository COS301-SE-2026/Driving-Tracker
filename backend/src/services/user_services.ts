import prisma from '../db/prisma';
import bcrypt from 'bcrypt';
import { ValidationError, ExtendedError} from '../utils/errors';

export const user_services = {
    async delete_account(user_id: string, password: string) : Promise<void>{

        const user = await prisma.users.findUnique({ where: { user_id}});

        if (!user){
            throw new ExtendedError("User not found", "UNAUTHORIZED");
        }

        const valid = await bcrypt.compare(password, user.password_hash);

        if (!valid){
            throw new ValidationError("Password Incorrect", "password");
        }

        await prisma.users.delete({ where: {user_id}});
    }
};