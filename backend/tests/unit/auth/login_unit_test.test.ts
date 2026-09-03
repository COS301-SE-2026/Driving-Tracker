import { describe, expect, it, jest,beforeEach } from '@jest/globals';
import auth_controller from '../../../src/controllers/auth.controller';
const { login } = auth_controller;
import { auth_services } from '../../../src/services/auth_services';
import {  ValidationError } from '../../../src/utils/errors';
import { resetIdentifierLimiter } from '../../../src/middleware/rate_limit';
import { createMockUser } from './mock_user';



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

describe('Auth login endpoint',()=>{
    beforeEach(async()=> {
        jest.clearAllMocks()
        resetIdentifierLimiter();
    });
    
    it('Returns 201 and tokens on successful login',async ()=>{
        jest.spyOn(auth_services,'login').mockResolvedValueOnce({
            user: createMockUser(),
            refresh_token: 'refresh-1',
        });

        const req: any = {
            body:{
                identifier: 'tester',
                password: 'Password123!'
            },
        };
        const json =jest.fn();
        const status = jest.fn().mockReturnValue({json});
        const res: any = {status};

        await login(req, res);
        expect(status).toHaveBeenCalledWith(201);
        expect(json).toHaveBeenCalledWith({
            token: 'mocked-access-token',
            refresh_token: 'refresh-1'
        });
    });

    it('Returns 401 on validation error',async ()=>{
        const mockedAuth = auth_services as  unknown as jest.Mocked<typeof auth_services>;
        mockedAuth.login.mockRejectedValueOnce(new ValidationError('Invalid credentials','credentials'));
        const req: any = {
            body: {
                identifier: 'tester', password: 'bad' 
            },
        };
        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });
        const res: any = { status };

        await login(req,res);
        expect(status).toHaveBeenCalledWith(401);
        expect(json).toHaveBeenCalledWith(expect.objectContaining({
            error: 'INVALID_CREDENTIALS' 
        }));
    });

    it('returns 500 on unexpected error', async ()=>{
        const mockedAuth = auth_services as unknown as jest.Mocked<typeof auth_services>;
        mockedAuth.login.mockRejectedValueOnce(new Error('boom'));

        const req: any = { 
            body: { 
                identifier: 'tester', 
                password: 'Password123!' 
            } 
        };
        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });
        const res: any = { status };

        await login(req, res);

        expect(status).toHaveBeenCalledWith(500);
        expect(json).toHaveBeenCalledWith({ 
            error: 'INTERNAL_SERVER_ERROR' 
        });
  });

  it('returns 429 on rate limit reached', async ()=>{

        const mockedAuth = auth_services as unknown as jest.Mocked<typeof auth_services>;
        mockedAuth.login.mockRejectedValue(new ValidationError('Invalid credentials','credentials'));

        const req: any = { 
            body: { 
                identifier: 'tester', 
                password: 'Password123!' 
            } 
        };

        const json = jest.fn();
        const send = jest.fn()
        const status = jest.fn().mockReturnValue({ json, send });
        const res: any = { status, json, send };

        for(let i = 0; i<10; i++){
            await login(req, res);
            }

        status.mockClear();
        json.mockClear();
        
        await login(req, res);
        expect(status).toHaveBeenCalledWith(429);
        expect(json).toHaveBeenCalledWith({ 
            error: "TOO_MANY_ATTEMPTS", message: "Too many login attempts, try again later" 
        });
  });
})