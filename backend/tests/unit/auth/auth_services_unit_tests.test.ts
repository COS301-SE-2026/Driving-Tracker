jest.mock('../../../src/db/prisma', () => ({
    __esModule: true,
    default: {
        users: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        },
    },
}));

jest.mock('../../../src/middleware/auth', () => ({
    generate_token: jest.fn(() => 'mock_token'),
    generate_refresh_token: jest.fn(() => 'mock_refresh_token'),
    verify_token: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
    verify: jest.fn((token, secret) => {
        if (token === 'valid_refresh_token') {
            return { sub: 'u1', iat: Math.floor(Date.now() / 1000) };
        }
        throw new Error('jwt malformed');
    }),
    sign: jest.fn(() => 'mock_jwt_token'),
}));

jest.mock('bcrypt');

jest.mock('../../../src/utils/email', () =>({
    sendAuthEmail: jest.fn(),
}));

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import prisma from '../../../src/db/prisma';
import { auth_services } from '../../../src/services/auth_services';
import bcrypt from 'bcrypt';
import { sendAuthEmail } from '../../../src/utils/email';
import { ValidationError } from '../../../src/utils/errors';
import { refreshToken } from 'firebase-admin/app';

const mock_prisma = prisma as any;
const mock_bcrypt = bcrypt as any;
const mock_sendAuthEmail = sendAuthEmail as jest.Mock;

describe('Auth services.register', () => {
    beforeEach(async() => jest.clearAllMocks());

    it('registers user successfully', async () => {
        mock_prisma.users.findFirst.mockResolvedValue(null);
        mock_bcrypt.hash.mockResolvedValue('hashed_password');
        mock_prisma.users.create.mockResolvedValue({
            user_id: 'u1',
            email: 'test@example.com',
            username: 'testuser12345',
            name: 'Test',
            surname: 'User',
            phone_number: '0123456789',
            dob: new Date('2000-01-01'),
            consent_status: true,
        });

        const result = await auth_services.register(
            'test@example.com',
            'testuser12345',
            'Test',
            'User',
            'Password123!',
            '0123456789',
            '2000-01-01',
            true
        );

        expect(result.user.user_id).toBe('u1');
    });

    it('throws when consent not accepted', async () => {
        await expect(
            auth_services.register(
            'test@example.com',
            'testuser12345',
            'Test',
            'User',
            'Password123!',
            '07123456789',
            '2000-01-01',
            false
        )).rejects.toThrow('You must accept the terms to register');
    });

    it('throws when email already exists', async () => {
        mock_prisma.users.findFirst.mockResolvedValue({
            user_id: 'u999',
            email: 'test@example.com',
        });

        await expect(
        auth_services.register(
            'test@example.com',
            'newuser12345',
            'Test',
            'User',
            'Password123!',
            '0123456789',
            '2000-01-01',
            true
        )).rejects.toThrow();
    });

    it('throws when user under 18', async () => {
        const today = new Date();
        const under18 = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());

        await expect(
        auth_services.register(
            'test@example.com',
            'testuser12345',
            'Test',
            'User',
            'Password123!',
            '0123456789',
            under18.toISOString().split('T')[0],
            true
        )).rejects.toThrow();
    });
});

describe('Auth services.login', () => {
    beforeEach(async() => jest.clearAllMocks());

    it('logs in user successfully with email', async () => {
        mock_prisma.users.findFirst.mockResolvedValue({
            user_id: 'u1',
            email: 'test@example.com',
            password_hash: 'hashed_password',
            username: 'testuser',
            email_verified: true,
        });
        mock_bcrypt.compare.mockResolvedValue(true);

        const result = await auth_services.login('test@example.com', 'Password123!');

        expect(result.user.user_id).toBe('u1');
        expect(result.refresh_token).toBeDefined();
    });

    it('throws when user not found', async () => {
        mock_prisma.users.findFirst.mockResolvedValue(null);

        await expect(auth_services.login('nonexistent@example.com', 'Password123!')).rejects.toThrow();
    });

    it('throws when password incorrect', async () => {
        mock_prisma.users.findFirst.mockResolvedValue({
            user_id: 'u1',
            email: 'test@example.com',
            password_hash: 'hashed_password',
            username: 'testuser',
        });
        mock_bcrypt.compare.mockResolvedValue(false);

        await expect(auth_services.login('test@example.com', 'WrongPassword123!')).rejects.toThrow();
    });
});

describe('Auth services.refresh', () => {
    beforeEach(async() => jest.clearAllMocks());

    it('refreshes token successfully', async () => {
        mock_prisma.users.findFirst.mockResolvedValue({
            user_id: 'u1',
            username: 'testuser',
            email: 'test@example.com',
        });

        const result = await auth_services.refresh('valid_refresh_token');

        expect(result.new_refresh_token).toBeDefined();
    });

    it('throws when user not found', async () => {
        mock_prisma.users.findUnique.mockResolvedValue(null);

        await expect(auth_services.refresh('u99')).rejects.toThrow();
    });
});

describe('Auth services.get_profile', () => {
    beforeEach(async() => jest.clearAllMocks());

    it('returns user profile successfully', async () => {
        mock_prisma.users.findUnique.mockResolvedValue({
            user_id: 'u1',
            username: 'testuser',
            name: 'Test',
            surname: 'User',
            email: 'test@example.com',
            phone_number: '0123456789',
            dob: new Date('2000-01-01'),
            _count: {
                trips: 5,
                user_badges: 3,
                users_vehicles: 1
            }
        });

        const result = await auth_services.get_profile('u1');

        expect(result.user_id).toBe('u1');
        expect(result.trip_count).toBe(5);
        expect(result.badge_count).toBe(3);
        expect(result.vehicle_count).toBe(1);
    });

    it('throws when user not found', async () => {
        mock_prisma.users.findUnique.mockResolvedValue(null);

        await expect(auth_services.get_profile('nonexistent')).rejects.toThrow('User not found');
    });
}); 

describe('Auth services.verify_email', () => {
    beforeEach(async () => jest.clearAllMocks());

    it('verifies email and clears verification token', async () => {
        mock_prisma.users.findFirst.mockResolvedValue({
            user_id: 'u1',
            verification_token: 'v-token-1',
            email_verified: false,
        });

        mock_prisma.users.update.mockResolvedValue({
            user_id: 'u1',
            email_verified: true,
            verification_token: null,
        });

        await auth_services.verify_email('v-token-1');

        expect(mock_prisma.users.findFirst).toHaveBeenCalledWith({
            where: { verification_token: 'v-token-1' },
        });

        expect(mock_prisma.users.update).toHaveBeenCalledWith({
            where: { user_id: 'u1' },
            data: {
                email_verified: true,
                verification_token: null,
            },
        });
    });

    it('throws for missing token', async () => {
        await expect(auth_services.verify_email('')).rejects.toThrow(ValidationError);
    });

    it('throws for invalid token', async () => {
        mock_prisma.users.findFirst.mockResolvedValue(null);
        await expect(auth_services.verify_email('bad-token')).rejects.toThrow('INVALID_OR_EXPIRED_TOKEN');
    });
});

describe('Auth services.request_password_reset', () => {
    beforeEach(async () => jest.clearAllMocks());

    it('sets reset token and expiry and sends email for existing user', async () => {
        mock_prisma.users.findUnique.mockResolvedValue({
            user_id: 'u2',
            email: 'test@example.com'
        });

        mock_prisma.users.update.mockResolvedValue({
            user_id: 'u2',
        });

        await auth_services.request_password_reset('test@example.com');

        expect(mock_prisma.users.findUnique).toHaveBeenCalledWith({
            where: { email: 'test@example.com' },
        });

        expect(mock_prisma.users.update).toHaveBeenCalledWith({
            where: { email: 'test@example.com' },
            data: {
                password_reset_token: expect.any(String),
                reset_token_exp: expect.any(Date),
            },
        });

        expect(mock_sendAuthEmail).toHaveBeenCalledTimes(1);
        expect(mock_sendAuthEmail).toHaveBeenCalledWith(
            'test@example.com',
            'Reset your Driving Tracker Password',
            expect.stringContaining('Password Reset Request')
        );
    });

    it('returns silently for non-existing user', async () => {
        mock_prisma.users.findUnique.mockResolvedValue(null);
        await expect(auth_services.request_password_reset('nobody@example.com')).resolves.toBeUndefined();
        
        expect(mock_prisma.users.update).not.toHaveBeenCalled();
        expect(mock_sendAuthEmail).not.toHaveBeenCalled();
    });

    it('returns silently for invalid email format', async () => {
        await expect(auth_services.request_password_reset('not-an-email')).resolves.toBeUndefined();
        expect(mock_prisma.users.findUnique).not.toHaveBeenCalled();
        expect(mock_prisma.users.update).not.toHaveBeenCalled();
        expect(mock_sendAuthEmail).not.toHaveBeenCalled();
    });
});

describe('Auth services.reset_password', () => {
    beforeEach(async () => jest.clearAllMocks());

    it('resets password for valid token with unexpired reset_token_exp', async () => {
        mock_prisma.users.findFirst.mockResolvedValue({
            user_id: 'u3',
            password_reset_token: 'reset-okay',
            reset_token_exp: new Date(Date.now() + 60_000),
        });

        mock_bcrypt.hash.mockResolvedValue('new_hashed_pw');
        mock_prisma.users.update.mockResolvedValue({
            user_id: 'u3',
        });

        await auth_services.reset_password('reset-okay', 'Password123!');

        expect(mock_prisma.users.findFirst).toHaveBeenCalledWith({
            where: { 
                password_reset_token: 'reset-okay',
                reset_token_exp: { gt: expect.any(Date)},
            },
        });

        expect(mock_prisma.users.update).toHaveBeenCalledWith({
            where: { user_id: 'u3' },
            data: {
                password_hash: 'new_hashed_pw',
                password_reset_token: null,
                reset_token_exp: null,
                refresh_token: null,
                refresh_token_exp: null,
            },
        });
    });

    it('throws for expired or invalid reset token', async () => {
        mock_prisma.users.findFirst.mockResolvedValue(null);
        await expect(auth_services.reset_password('expired-token', 'Password123!')).rejects.toThrow('INVALID_OR_EXPIRED_TOKEN');
    });

    it('throws for weak new password', async () => {
        await expect(auth_services.reset_password('some-token', 'weak')).rejects.toThrow(ValidationError);
        expect(mock_prisma.users.findFirst).not.toHaveBeenCalled();
    });

    it('throws for missing token', async () => {
        await expect(auth_services.reset_password('', 'Password123!')).rejects.toThrow(ValidationError);
    });
});


