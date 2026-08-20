import request from 'supertest';
import bcrypt from 'bcrypt';
import { describe, expect, it, beforeEach, afterAll } from '@jest/globals';
import app from '../../../src/app';
import prisma from '../../../src/db/prisma';

describe('Auth login integration test', () => {
	beforeEach(async () => {
		await prisma.users.deleteMany();
	});

	afterAll(async () => {
		await prisma.$disconnect();
	});

	it('logs in a seeded user and updates refresh token in the database', async () => {
		const password = 'Password123!';
		const password_hash = await bcrypt.hash(password, 10);

		const user = await prisma.users.create({
			data: {
				email: 'test_login@gmail.com',
				username: 'login_user',
				name: 'Login',
				surname: 'User',
				dob: new Date('2000-01-01'),
				phone_number: '+27123456789',
				password_hash,
				consent_status: true,
				email_verified: true,
			},
		});
		const response = await request(app).post('/api/auth/login').send({
			identifier: 'login_user', 
			password,
		});

		expect(response.status).toBe(201);
		expect(response.body.token).toBeDefined();
		expect(response.body.refresh_token).toBeDefined();

		const updatedUser = await prisma.users.findUnique({
			where: { user_id: user.user_id },
		});

		expect(updatedUser?.refresh_token).toBeDefined();
	});
});
