jest.mock('../../../src/services/auth_services');
jest.mock('../../../src/middleware/auth', () => ({
    generate_token: jest.fn(() => 'mocked-access-token'),
}));

import { describe, expect, it, jest } from '@jest/globals';
import auth_controller from '../../../src/controllers/auth.controller';
const { refresh } = auth_controller;
import { auth_services } from '../../../src/services/auth_services';
import { ExtendedError} from '../../../src/utils/errors';
import { beforeEach } from 'node:test';

describe('Auth refresh endpoint', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns 400 when refresh_token missing', async () => {
        const req: any = { body: {} };
        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });
        const res: any = { status };

        await refresh(req, res);

        expect(status).toHaveBeenCalledWith(400);
        expect(json).toHaveBeenCalledWith({ error: 'MISSING_REFRESH_TOKEN', message: 'Refresh token required' });
    });

    it('returns 200 and tokens on successful refresh', async () => {
        jest.spyOn(auth_services, 'refresh').mockResolvedValueOnce({
        user: { user_id: 'user-1', role: 'user' },
        new_refresh_token: 'new-refresh-1',
        });
        const req: any = { body: { refresh_token: 'old-refresh-1' } };
        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });
        const res: any = { status };

        await refresh(req, res);

        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith({
        token: 'mocked-access-token',
        refresh_token: 'new-refresh-1',
        });
    });

    it('returns 401 when service throws ExtendedError', async () => {
        const mockedAuth = auth_services as unknown as jest.Mocked<typeof auth_services>;
        mockedAuth.refresh.mockRejectedValueOnce(new ExtendedError('Invalid refresh', 'UNAUTHORIZED'));

        const req: any = { body: { refresh_token: 'bad' } };
        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });
        const res: any = { status };

        await refresh(req, res);

        expect(status).toHaveBeenCalledWith(401);
        expect(json).toHaveBeenCalledWith(expect.objectContaining({ error: 'UNAUTHORIZED', message: 'Invalid refresh' }));
    });
    it('returns 500 on unexpected error', async () => {
        const mockedAuth = auth_services as unknown as jest.Mocked<typeof auth_services>;
        mockedAuth.refresh.mockRejectedValueOnce(new Error('boom'));

        const req: any = { body: { refresh_token: 'whatever' } };
        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });
        const res: any = { status };

        await refresh(req, res);

        expect(status).toHaveBeenCalledWith(500);
        expect(json).toHaveBeenCalledWith({ error: 'INTERNAL_SERVER_ERROR' });
    });
});