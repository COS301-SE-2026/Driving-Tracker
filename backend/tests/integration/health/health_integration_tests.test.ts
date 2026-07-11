import request from 'supertest';
import app from '../../../src/app';
import { describe, expect, it } from '@jest/globals';

describe('Health endpoint', () => {
	it('returns ok', async () => {
		const response = await request(app).get('/health');

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			status: 'ok',
			message: 'Driving Tracker API is running',
		});
	});
});