import { describe, expect, it, jest } from '@jest/globals';
import auth_controller from '../../../src/controllers/auth.controller';
const { register } = auth_controller;
import { auth_services } from '../../../src/services/auth_services';
import { ConflictError, ValidationError } from '../../../src/utils/errors';
import { beforeEach } from 'node:test';


jest.mock('../../../src/services/auth_services');
jest.mock('../../../src/middleware/auth', () => ({
generate_token: jest.fn(() => 'mocked-access-token'),
}));

describe('Auth register endpoint',()=>{
    beforeEach(()=> jest.clearAllMocks());
   
    it('returns 201 and tokens on successful registration', async () => {
        const registerSpy = jest.spyOn(auth_services, 'register').mockResolvedValueOnce({
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

})
