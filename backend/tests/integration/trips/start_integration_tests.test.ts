import request from 'supertest';
import { describe, expect, it, afterAll, beforeEach } from '@jest/globals';
import app from '../../../src/app';
import prisma from '../../../src/db/prisma';
import { seedUserAndLogin, cleanTripsData } from '../helpers';

describe('POST trips/start_trip integration test', () => {
	beforeEach(async () => {
		await cleanTripsData();
	})

	afterAll(async () => {
		await prisma.$disconnect();
	});

	it('creates a trip record and returns trip_id', async () =>{
		const unique = Date.now();
		const { user, vehicle, token } = await seedUserAndLogin(unique);

		const res = await request (app).post('/trips/start_trip')
		.set('Authorization', `Bearer ${token}`).send({
			vehicle_id: vehicle,
			data_source: 'PHONE',
			start_date: new Date().toISOString(),
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

	it('returns 401 when no token is provided', async () => {
		const res = await request(app).post('/trips/start_trip').send({
			vehicle_id: 'dummy',
			data_source: 'PHONE',
			start_date: new Date().toISOString(),
			start_location: { lat: -25.77116, lng: 28.29979 },
		});
		expect(res.status).toBe(401);
	});

	it('returns 409 when user already has an active trip', async () => {
		const unique = Date.now();
		const { user, vehicle, token } = await seedUserAndLogin(unique);

		await prisma.trips.create({
			data: {
				user_id: user.user_id,
				vehicle_id: vehicle,
				status: 'IN_PROGRESS',
				start_time: new Date(),
				start_latitude: -25.77116,
				start_longitude: 28.29979,
				data_source: 'PHONE',
			},
		});

		const res = await request(app).post('/trips/start_trip').set('Authorization', `Bearer ${token}`)
		.send({
			vehicle_id: vehicle,
			data_source: 'PHONE',
			start_date: new Date().toISOString(),
			start_location: { lat: -25.77116, lng: 28.29979 },
		});
		expect(res.status).toBe(409);
	});
});
