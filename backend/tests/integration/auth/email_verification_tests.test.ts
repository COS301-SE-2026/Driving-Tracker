jest.mock('../../../src/utils/email', () => ({
    sendAuthEmail: jest.fn(),
}));

import request from 'supertest';
import { describe, expect, it, beforeEach, afterAll, jest } from '@jest/globals';
import app from '../../../src/app';
import prisma from '../../../src/db/prisma';

describe('Auth verify email integration test', () => {
	afterAll(async () => {
		await prisma.$disconnect();
	});

	it('verifies a registered user email and clears verification token', async () => {
		const unique = Date.now();

		const registerRes = await request(app).post('/api/auth/register').send({
			email: `verify_${unique}@gmail.com`,
			username: `verify_user_${unique}`,
            password: 'Password123!',
			name: 'Verify',
			surname: 'User',
			dob: '2000-01-01',
			phone_number: '0123456789',
			consent_status: true,
		});

        expect(registerRes.status).toBe(201);

		const created = await prisma.users.findFirst({
            where: { email: `verify_${unique}@gmail.com`}
        });

		expect(created).not.toBeNull();
		expect(created?.email_verified).toBe(false);
		expect(created?.verification_token).toBeTruthy();

		const verifyRes = await request(app).get('/api/auth/verify_email').query({
			token: created!.verification_token,
		});

		expect(verifyRes.status).toBe(200);

        const updated = await prisma.users.findUnique({
            where: { user_id: created!.user_id },
        });

        expect(updated?.email_verified).toBe(true);
		expect(updated?.verification_token).toBeNull();

        const reuseRes = await request(app).get('/api/auth/verify_email').query({
            token: created!.verification_token,
        });

        expect(reuseRes.status).toBe(400);
	});
});
