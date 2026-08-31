jest.mock('../../../src/utils/email', () => ({
    sendAuthEmail: jest.fn(),
}));

import request from 'supertest';
import bcrypt from 'bcrypt';
import { describe, expect, it, beforeEach, afterAll, jest } from '@jest/globals';
import app from '../../../src/app';
import prisma from '../../../src/db/prisma';

describe('Auth forgot/reset password integration test', () => {
    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('handles forgot password with normalized emaol and resets password with valid token', async () => {
		const unique = Date.now();
        const originalPassword = 'Password123!';
        const newPassword = 'NewPassword123!';

        const password_hash = await bcrypt.hash(originalPassword, 10);

		const seeded = await prisma.users.create({
            data: {
                email: `reset_${unique}@gmail.com`,
                username: `reset_user_${unique}`,
                name: 'Reset',
                surname: 'User',
                dob: new Date('2000-01-01'),
                phone_number: '0123456789',
                password_hash,
                consent_status: true,
                email_verified: true,
            },
		});

        const forgotRes = await request(app).post('/api/auth/forgot_password').send({
			email: `reset_${unique}@gmail.com`,
		});

        expect(forgotRes.status).toBe(200);
        expect(forgotRes.body.message).toBe('Reset email sent if account exists');

		const withResetToken = await prisma.users.findUnique({
            where: { user_id: seeded.user_id },
        });

		expect(withResetToken?.password_reset_token).toBeTruthy();
		expect(withResetToken?.reset_token_exp).toBeTruthy();
		expect(new Date(withResetToken!.reset_token_exp!).getTime()).toBeGreaterThan(Date.now());

		const weakRes = await request(app).post('/api/auth/reset_password').send({
			token: withResetToken!.password_reset_token,
            password: 'weak',
		});

		expect(weakRes.status).toBe(422);

        const resetRes = await request(app).post('/api/auth/reset_password').send({
			token: withResetToken!.password_reset_token,
            password: newPassword,
		});

		expect(resetRes.status).toBe(200);

        const afterReset = await prisma.users.findUnique({
            where: { user_id: seeded.user_id },
        });

        expect(afterReset?.password_reset_token).toBeNull();
		expect(afterReset?.reset_token_exp).toBeNull();

        const oldLogin = await request(app).post('/api/auth/login').send({
            identifier: seeded.email,
            password: originalPassword,
        });

        expect(oldLogin.status).toBe(401);

        const newLogin = await request(app).post('/api/auth/login').send({
            identifier: seeded.email,
            password: newPassword,
        });

        expect(newLogin.status).toBe(201);
        expect(newLogin.body.token).toBeDefined();
        expect(newLogin.body.refresh_token).toBeDefined();
	});

    it('rejects expired reset token', async () => {
		const unique = Date.now() + 1;
        const password_hash = await bcrypt.hash('Password123!', 10);

		const seeded = await prisma.users.create({
			data: {
                email: `expired_${unique}@gmail.com`,
                username: `expired_user_${unique}`,
                name: 'Expired',
                surname: 'User',
                dob: new Date('2000-01-01'),
                phone_number: '0123456789',
                password_hash,
                consent_status: true,
                email_verified: true,
                password_reset_token: 'expired-token',
                refresh_token_exp: new Date(Date.now() - 60_000),
            },
		});

		const res = await request(app).post('/api/auth/reset_password').send({
			token: 'expired-token',
            password: 'NewPassword123!',
		});

		expect(res.status).toBe(400);

        await prisma.users.delete({
            where: { user_id: seeded.user_id }
        });
	});
});