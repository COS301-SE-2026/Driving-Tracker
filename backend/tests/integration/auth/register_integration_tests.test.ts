jest.mock('../../../src/utils/email', () => ({
	sendAuthEmail: jest.fn(),
}));

import request from 'supertest';
import { describe, expect, it, afterAll, jest } from '@jest/globals';
import app from '../../../src/app';
import prisma from '../../../src/db/prisma';
import { sendAuthEmail } from '../../../src/utils/email';

describe('Auth register integration test', () => {
	afterAll(async () => {
		await prisma.$disconnect();
	});

	it('registers a new user and stores them in the database', async () => {
		const unique = Date.now();

		const response = await request(app).post('/api/auth/register').send({
			email: `register_${unique}@gmail.com`,
			username: `register_user_${unique}`,
			password: 'Password123!',
			name: 'Register',
			surname: 'User',
			phone_number: '0123455656',
			dob: '2000-01-01',
			consent_status: true,
		});

		expect(response.status).toBe(201);
		expect(response.body.token).toBeDefined();
		expect(response.body.refresh_token).toBeDefined();

		const createdUser = await prisma.users.findFirst({
			where: { email: `register_${unique}@gmail.com`, },
		});

		expect(createdUser).not.toBeNull();
		expect(createdUser?.username).toBe(`register_user_${unique}`);
		expect(createdUser?.password_hash).not.toBe('Password123!');
	});
});