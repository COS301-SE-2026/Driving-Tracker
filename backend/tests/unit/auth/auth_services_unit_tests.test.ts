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

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import prisma from '../../../src/db/prisma';
import { auth_services } from '../../../src/services/auth_services';
import bcrypt from 'bcrypt';

const mock_prisma = prisma as any;
const mock_bcrypt = bcrypt as any;

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
            phone_number: '+27123456789',
            dob: new Date('2000-01-01'),
            consent_status: true,
        });

        const result = await auth_services.register(
            'test@example.com',
            'testuser12345',
            'Test',
            'User',
            'Password123!',
            '+27123456789',
            '2000-01-01',
            true
        );

        expect(result.user.user_id).toBe('u1');
        expect(result.refresh_token).toBeDefined();
    });

    it('throws when consent not accepted', async () => {
        await expect(
            auth_services.register(
            'test@example.com',
            'testuser12345',
            'Test',
            'User',
            'Password123!',
            '+27123456789',
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
            '+27123456789',
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
            '+27123456789',
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
            phone_number: '+27123456789',
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