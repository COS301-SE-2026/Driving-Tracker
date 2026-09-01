import request from 'supertest';
import { describe, expect, it, afterAll, beforeEach } from '@jest/globals';
import app from '../../../src/app';
import prisma from '../../../src/db/prisma';
import { seedUserAndLogin, cleanDatabase } from '../helpers';

describe('GET /leaderboard/categories integration test', () => {
	beforeEach(async () => {
		await cleanDatabase();
	});

	afterAll(async () => {
		await prisma.$disconnect();
	});

	it('returns a list of distinct categories', async () => {
		const unique = Date.now();
		const { user, token } = await seedUserAndLogin(unique);

		const res = await request(app).get('/leaderboard/categories').set('Authorization', `Bearer ${token}`);

		expect(res.status).toBe(200);
		expect(res.body.data.categories).toContain('SAFETY');
		expect(res.body.data.categories).toContain('ECO');
	});

	it('returns 401 when unauthorized', async () =>{
		const res = await request(app).get('/leaderboard/categories');
		expect(res.status).toBe(401);
	});
});