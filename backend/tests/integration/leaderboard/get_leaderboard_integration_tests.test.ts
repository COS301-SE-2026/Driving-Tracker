import request from 'supertest';
import { describe, expect, it, afterAll, beforeEach } from '@jest/globals';
import app from '../../../src/app';
import prisma from '../../../src/db/prisma';
import { seedUserAndLogin, cleanDatabase } from '../helpers';

describe('GET /leaderboard integration test', () => {
	beforeEach(async () => {
		await cleanDatabase();
	});

	afterAll(async () => {
		await prisma.$disconnect();
	});

	it('returns the leaderboard and calculates my_rank', async () => {
		const unique = Date.now();
		const { user: owner, token } = await seedUserAndLogin(unique);
		const { user: other_user } = await seedUserAndLogin(unique + 1);
	
		await prisma.leaderboard.createMany({
			data: [
				{
					user_id: other_user.user_id,
					category: 'SAFETY',
					scope: 'GLOBAL',
					score: 95
				},
				{
					user_id: owner.user_id,
					category: 'SAFETY',
					scope: 'GLOBAL',
					score: 85
				}
			]
		});

		const res = await request(app).get('/leaderboard').query({category: 'SAFETY', scope: 'GLOBAL'})
			.set('Authorization', `Bearer ${token}`);

		expect(res.status).toBe(200);
		expect(res.body.data.entries).toHaveLength(2);
		expect(res.body.data.entries[0].user_id).toBe(other_user.user_id);
		expect(res.body.data.my_rank).toBe(2);
		expect(res.body.data.my_score).toBe(85);
	});

	it('returns 400 when category or scope is missing', async () => {
		const { token } = await seedUserAndLogin(Date.now());
		const res = await request(app).get('/leaderboard').query({category: '', scope: ''}).set('Authorization', `Bearer ${token}`);

		expect(res.status).toBe(400);
		expect(res.body.error).toBe('BAD_REQUEST');
	});


});