import { describe, expect, it, jest } from '@jest/globals';
import auth_controller from '../../../src/controllers/auth.controller';
const { register,login } = auth_controller;
import { auth_services } from '../../../src/services/auth_services';
import { ConflictError, ValidationError } from '../../../src/utils/errors';
import { beforeEach } from 'node:test';


jest.mock('../../../src/services/auth_services');
jest.mock('../../../src/middleware/auth', () => ({
generate_token: jest.fn(() => 'mocked-access-token'),
}));
jest.mock('../../../src/db/prisma', () => ({
  __esModule: true,
  default: {
    users: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('Auth register endpoint',()=>{
    beforeEach(()=> jest.clearAllMocks());
   
    it('returns 201 and tokens on successful registration', async () => {
        jest.spyOn(auth_services, 'register').mockResolvedValueOnce({
            user: { user_id: 'user-1', role: 'user' },
            refresh_token: 'refresh-1',
        });

        const req: any = {
            body: {
                email: 'test@example.com',
                username: 'tester',
                password: 'Password123!',
                name: 'Test',
                surname: 'User',
                consent_status: true,
            },
        };

        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });
        const res: any = { status };

        await register(req, res);

        expect(status).toHaveBeenCalledWith(201);
        expect(json).toHaveBeenCalledWith({
            token: 'mocked-access-token',
            refresh_token: 'refresh-1',
        });
    });
    it('Returns 409 when service throws conflict error', async() =>{
        const mockedAuth = auth_services as unknown as jest.Mocked<typeof auth_services>;
        mockedAuth.register.mockRejectedValueOnce(new ConflictError('Email already exits','email'));
        const req: any = {
            body: {
                email: 'test@example.com',
                username: 'tester',
                password: 'Password123!',
                name: 'Test',
                surname: 'User',
                consent_status: true,
            },
        };
        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });
        const res: any = {status};
        await register(req,res);

        expect(status).toHaveBeenCalledWith(409);
        expect(json).toHaveBeenCalledWith(expect.objectContaining({ error: 'EMAIL_TAKEN' }));
    });
    
    it('Returns 422 when services throws validation error', async()=>{
        const mockedAuth = auth_services as unknown as jest.Mocked<typeof auth_services>;

        //CASE where the name was left empty 
        mockedAuth.register.mockRejectedValueOnce(new ValidationError('Invalid input','name'));
        const req1: any ={
            body:{
                email: 'test@example.com',
                username: 'tester',
                password: 'Password123!',
                name: '',
                surname: 'User',
                consent_status: true,
            },
        };
        const json1 = jest.fn();
        const status1 = jest.fn().mockReturnValue({ json: json1 });
        const res1: any = { status: status1 };
        
        await register(req1,res1);

        expect(status1).toHaveBeenCalledWith(422);
        expect(json1).toHaveBeenCalledWith(expect.objectContaining({ error: 'INVALID_NAME' }));

        //CASE where the surname was left empty 
        mockedAuth.register.mockRejectedValueOnce(new ValidationError('Invalid input','surname'));
        const req_surname : any={
            body:{
                email: 'test@example.com',
                username: 'tester',
                password: 'Password123!',
                name: 'Test',
                surname: '',
                consent_status: true,
            },
        };

        const json_surname = jest.fn();
        const status_surname = jest.fn().mockReturnValue({ json: json_surname });
        const res_surname: any = { status: status_surname };

        await register(req_surname,res_surname);

        expect(status_surname).toHaveBeenCalledWith(422);
        expect(json_surname).toHaveBeenCalledWith(expect.objectContaining({ error: 'INVALID_SURNAME' }));
    });
});


