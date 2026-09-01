import request from 'supertest';
import { describe, expect, it, afterAll, beforeEach } from '@jest/globals';
import app from '../../../src/app';
import prisma from '../../../src/db/prisma';
import { seedUserAndLogin, cleanDatabase } from '../helpers';

describe('GET /leaderboard/scopes integration test', () => {
	beforeEach(async () => {
		await cleanDatabase();
	});

	afterAll(async () => {
		await prisma.$disconnect();
	});

	it('returns a list of distinct scopes', async () => {
		const unique = Date.now();
		const { user, token } = await seedUserAndLogin(unique);

		const res = await request(app).get('/leaderboard/scopes').set('Authorization', `Bearer ${token}`);

		expect(res.status).toBe(200);
		expect(res.body.data.scopes).toContain('ALL_TIME');
		expect(res.body.data.scopes).toContain('WEEKLY');
	});

	it('returns 401 when unauthorized', async () =>{
		const res = await request(app).get('/leaderboard/scopes');
		expect(res.status).toBe(401);
	});
});