import {describe, it,expect,jest,beforeEach} from '@jest/globals';
import prisma from '../../../src/db/prisma';
import bcrypt from 'bcrypt';
import { user_services } from '../../../src/services/user_services';
import user_controller from '../../../src/controllers/user_controller';
import {ValidationError, ExtendedError} from '../../../src/utils/errors';

jest.mock('../../../src/db/prisma', () => ({
    __esModule: true,
    default: {
        users: {
            findUnique: jest.fn(),
            delete: jest.fn(),
        },
    },
}));

jest.mock('bcrypt');

const mock_prisma = prisma as any;
const mock_bcrypt = bcrypt as any;

describe('delete account: services', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('deletes the users account successfully', async () => {

        mock_prisma.users.findUnique.mockResolvedValue({
            user_id: 'u1',
            password_hash: 'hashed_password',
        });
        mock_bcrypt.compare.mockResolvedValue(true);
        mock_prisma.users.delete.mockResolvedValue({user_id: 'u1'});

        await expect(
            user_services.delete_account('u1','StrongPass!')
        ).resolves.toBeUndefined();

        expect(mock_prisma.users.findUnique).toHaveBeenCalledWith({
            where: {user_id: 'u1'}
        });

        expect(mock_bcrypt.compare).toHaveBeenCalledWith(
            'StrongPass!','hashed_password'
        );

        expect(mock_prisma.users.delete).toHaveBeenCalledWith({
            where: {user_id: 'u1'},
        });
    });

    it ('throws ExtendedError when user is not found', async() => {

        mock_prisma.users.findUnique.mockResolvedValue(null);

        await expect(
            user_services.delete_account('missing-user', 'StrongPass!')
        ).rejects.toMatchObject({
            name: 'ExtendedError',
            errorCode: 'UNAUTHORIZED',
            message: 'User not found',
        });

        expect(mock_bcrypt.compare).not.toHaveBeenCalled();
        expect(mock_prisma.users.delete).not.toHaveBeenCalled();
    });

    it('throws ValidationError when password is incorrect', async ()=> {

        mock_prisma.users.findUnique.mockResolvedValue({
            user_id: 'u1',
            password_hash: 'hashed_password',
        });
        
        mock_bcrypt.compare.mockResolvedValue(false);

        await expect(
            user_services.delete_account('u1','WrongPass!')
        ).rejects.toMatchObject({
            name: 'ValidationError',
            field: 'password',
            message: 'Password Incorrect',
        });

        expect(mock_prisma.users.delete).not.toHaveBeenCalled();
    });
});

describe('delete account: controller', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const makeRes = () => {
        const json = jest.fn();
        const send = jest.fn();
        const status = jest.fn().mockImplementation(()=>({json,send}));
        return {status,json,send};
    };

    it ('returns 204 when the account is successfully deleted', async ()=> {

        const req: any = {
            user: {sub: 'u1'},
            body: {password: 'StrongPass!'},
        };
        const res: any = makeRes();

        jest.spyOn(user_services, 'delete_account').mockResolvedValueOnce(undefined);

        await user_controller.delete_account(req,res);

        expect(user_services.delete_account).toHaveBeenCalledWith(
            'u1','StrongPass!'
        );

        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.send).toHaveBeenCalledWith();
    });

    it('return 401 when not authenticated', async ()=> {

        const req: any = {
            user: undefined,
            body: {password: 'StrongPass!'},
        };
        const res: any = makeRes();

        await user_controller.delete_account(req,res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({error: 'UNAUTHORIZED'});
    });

    it('returns 422 when password is missing', async() => {

        const req: any = {
            user: {sub: 'u1'},
            body: {},
        };
        const res: any = makeRes();

        await user_controller.delete_account(req,res);

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.json).toHaveBeenCalledWith({
            error: 'MISSING_PASSWORD',
            message: 'Password is required.',
        });
    });

    it('return 422 when the services throws a Validation Error', async () => {

        const req: any = {
            user: {sub: 'u1'},
            body: {password: 'WrongPass!'},
        };
        const res: any = makeRes();

        jest.spyOn(user_services, 'delete_account')
        .mockRejectedValueOnce(new ValidationError('Password Incorrect', 'password'));

        await user_controller.delete_account(req,res);

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.json).toHaveBeenCalledWith({
            error: 'INVALID_PASSWORD',
            message: 'Password Incorrect',
        });
    });

    it('return 401 when the service throws a Extended Error with unauthorized', async () => {

        const req: any = {
            user: {sub: 'u1'},
            body: {password: 'StrongPass!'},
        };
        const res: any = makeRes();

        jest.spyOn(user_services, 'delete_account')
        .mockRejectedValueOnce(new ExtendedError('User not found', 'UNAUTHORIZED'));

        await user_controller.delete_account(req,res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: 'UNAUTHORIZED',
            message: 'User not found',
        });
    });

    it('return 500 when the service throws a non-auth ExtendedError', async () => {

        const req: any = {
            user: {sub: 'u1'},
            body: {password: 'StrongPass!'},
        };
        const res: any = makeRes();

        jest.spyOn(user_services, 'delete_account')
        .mockRejectedValueOnce(new ExtendedError('Database failure', 'DB_ERROR'));

        await user_controller.delete_account(req,res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: 'DB_ERROR',
            message: 'Database failure',
        });
    });

    it('returns 500 for unexpected errors', async () => {

        const req: any = {
            user: {sub: 'u1'},
            body: {password: 'StrongPass!'},
        };
        const res: any = makeRes();

        jest.spyOn(user_services, 'delete_account')
        .mockRejectedValueOnce(new Error('Unexpected boom'));

        await user_controller.delete_account(req,res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: 'INTERNAL_SERVER_ERROR',
        });
    });
})