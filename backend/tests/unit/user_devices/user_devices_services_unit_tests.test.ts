jest.mock('../../../src/db/prisma', () => ({
    __esModule: true,
    default: {
        user_devices: {
            upsert: jest.fn(),
            findMany: jest.fn()
        },
    }
}));

import {describe, it, expect, jest, beforeEach} from '@jest/globals';
import prisma from '../../../src/db/prisma';
import { user_devices_services } from '../../../src/services/user_devices_services';

const mockPrisma = prisma as any;


describe('user_devices_services', ()=> {

    describe('register_device_token', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('registers a device token successfully', async () => {
            mockPrisma.user_devices.upsert.mockResolvedValue({
                user_id: 'u1',
                fcm_token: 'token-1'
            });

            await expect(
                user_devices_services.register_device_token('u1', 'token-1')
            ).resolves.toBeUndefined();

            expect(mockPrisma.user_devices.upsert).toHaveBeenCalledWith({
                where: { fcm_token: 'token-1' },
                update: { user_id: 'u1', updated_at: expect.any(Date) },
                create: {
                    user_id: 'u1',
                    fcm_token: 'token-1'
                }
            });

        });

        it('throws ExtendedError when upsert fails', async () => {
            mockPrisma.user_devices.upsert.mockRejectedValue(new Error('db failed'));

            await expect(
                user_devices_services.register_device_token('u1', 'token-1')
            ).rejects.toMatchObject({ errorCode: 'INTERNAL_SERVER_ERROR' });
        });
    });

    describe('get_user_fcm_tokens', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('returns fcm tokens for a user', async () => {
            mockPrisma.user_devices.findMany.mockResolvedValue([
                { fcm_token: 'token-1' },
                { fcm_token: 'token-2' }
            ]);

            const result = await user_devices_services.get_user_fcm_tokens('u1');

            expect(result).toEqual(['token-1', 'token-2']);

            expect(mockPrisma.user_devices.findMany).toHaveBeenCalledWith({
                where: { user_id: 'u1' },
                select:  { fcm_token: true }
            });
        });

        it('throws ExtendedError when lookup fails', async () => {
            mockPrisma.user_devices.findMany.mockRejectedValue(new Error('db failed'));

            await expect(
                user_devices_services.get_user_fcm_tokens('u1')
            ).rejects.toMatchObject({ errorCode: 'FCM_TOKEN_RETRIEVAL_ERROR' });
        });
    });

    describe('get_multiple_users_fcm_tokens', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('returns fcm tokens for multiple users', async () => {
            mockPrisma.user_devices.findMany.mockResolvedValue([
                { fcm_token: 'token-1' },
                { fcm_token: 'token-2' }
            ]);

            const result = await user_devices_services.get_multiple_users_fcm_tokens(['u1', 'u2']);

            expect(result).toEqual(['token-1', 'token-2']);

            expect(mockPrisma.user_devices.findMany).toHaveBeenCalledWith({
                where: { user_id: { in:  ['u1', 'u2'] } },
                select:  { fcm_token: true }
            });
        });

        it('throws ExtendedError when lookup fails', async () => {
            mockPrisma.user_devices.findMany.mockRejectedValue(new Error('db failed'));

            await expect(
                user_devices_services.get_multiple_users_fcm_tokens(['u1', 'u2'])
            ).rejects.toMatchObject({ errorCode: 'FCM_TOKEN_RETRIEVAL_ERROR' });
        });
    });

});