import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import auth_controller from '../../../src/controllers/auth.controller';
import { auth_services } from '../../../src/services/auth_services';
import { ValidationError } from '../../../src/utils/errors';

jest.mock('../../../src/services/auth_services');

describe('Auth controller email verification and password reset endpoints', () => {
    beforeEach(async () => jest.clearAllMocks());

    it('returns 200 on verify_email success', async () => {
        const req: any = { query: { token: 'ok-token' } };
        const json = jest.fn();
        const status = jest.fn().mockReturnValueOnce({ json });
        const res: any = { status };

        jest.spyOn(auth_services, 'verify_email').mockResolvedValueOnce(undefined);

        await auth_controller.verify_email(req, res);

        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith({ message: 'Email verified successfully' });
    });

    it('returns 400 when token is missing', async () => {
        const req: any = { query: { } };
        const json = jest.fn();
        const status = jest.fn().mockReturnValueOnce({ json });
        const res: any = { status };

        await auth_controller.verify_email(req, res);

        expect(status).toHaveBeenCalledWith(400);
        expect(json).toHaveBeenCalledWith(
            expect.objectContaining({ error: 'INVALID_TOKEN' })
        );
    });

    it('returns 200 on successful password reset', async () => {
        const req: any = { body: { token: 'reset-token', password: 'Password123!' } };
        const json = jest.fn();
        const status = jest.fn().mockReturnValueOnce({ json });
        const res: any = { status };

        jest.spyOn(auth_services, 'reset_password').mockResolvedValueOnce(undefined);

        await auth_controller.reset_password(req, res);

        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith({ message: 'Password reset successfully'});
    });

    it('returns 422 on validation error for password reset', async () => {
        const req: any = { body: { token: 'reset-token', password: 'weak' } };
        const json = jest.fn();
        const status = jest.fn().mockReturnValueOnce({ json });
        const res: any = { status };

        jest.spyOn(auth_services, 'reset_password').mockRejectedValueOnce(
            new ValidationError('Password too weak', 'password')
        );

        await auth_controller.reset_password(req, res);

        expect(status).toHaveBeenCalledWith(422);
        expect(json).toHaveBeenCalledWith(expect.objectContaining({ error: 'INVALID_PASSWORD' }));
    });

    it('returns 400 on invalid token error for password reset', async () => {
        const req: any = { body: { token: 'bad-token', password: 'Password123!' } };
        const json = jest.fn();
        const status = jest.fn().mockReturnValueOnce({ json });
        const res: any = { status };

        jest.spyOn(auth_services, 'reset_password').mockRejectedValueOnce(
            new Error('INVALID_OR_EXPIRED_TOKEN')
        );

        await auth_controller.reset_password(req, res);

        expect(status).toHaveBeenCalledWith(400);
        expect(json).toHaveBeenCalledWith(expect.objectContaining({ error: 'INVALID_TOKEN' }));
    });
});