import request from 'supertest';
import bcrypt from 'bcrypt';
import { describe, expect, it, afterAll } from '@jest/globals';
import app from '../../../src/app';
import prisma from '../../../src/db/prisma';
import { seedUserAndLogin, cleanTripsData } from '../helpers';
import { DataSource } from '@prisma/client';

describe('POST trips/start_trip integration test', () => {
	afterAll(async () => {
		await prisma.$disconnect();
	});

	it('creates a trip record and returns trip_id', async () =>{
		const unique = Date.now();
		const { user, token } = await seedUserAndLogin(unique);

		const res = await request (app).post('/trips/start').set('Authorization', `Bearer ${token}`).send({
			data_source: 'PHONE',
			start_date: new Date().toISOString,
			start_location: { lat: -25.77116, lng: 28.29979 },
		});

		expect(res.status).toBe(200);
		expect(res.body.data.trip_id).toBeDefined();

		const trip = await prisma.trips.findUnique({
			where: {trip_id: res.body.data.trip_id},
		});

		expect(trip).not.toBeNull();
		expect(trip?.user_id).toBe(user.user_id);
		expect(trip?.status).toBe('IN_PROGRESS');
		expect(trip?.data_source).toBe('PHONE');
	});
});

