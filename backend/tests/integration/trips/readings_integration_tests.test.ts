import request from 'supertest';
import { describe, expect, it, afterAll, beforeEach } from '@jest/globals';
import app from '../../../src/app';
import prisma from '../../../src/db/prisma';
import { seedUserAndLogin, cleanTripsData } from '../helpers';

describe('POST /trips/:trip_id/readings/record integration test', () =>{
	beforeEach(async () => {
		await cleanTripsData();
	});

	afterAll(async () => {
		await prisma.$disconnect();
	});

	const buildReadingPayload = (overrides?: object) => ({
		recorded_at: new Date().toISOString(),
		location: {
			lng: 28.29979,
			lat: -25.77116,
		},
		data_source: 'PHONE',
		speed_kmh: 60.5,
		accelerometer: 0.12,
		gyroscope_x: 0.01,
		gyroscope_y: 0.00,
		gyroscope_z: -0.02,
		rpm: 2200,
		coolant_temp_c: 88.0,
		fuel_trim_percent: 1.5,
		throttle_position: 22.4,
		dtc_codes: [],
		...overrides,
	});

	it('records a reading and writes it to the trip_readings table', async () => {
		const unique = Date.now();
		const { user, vehicle, token } = await seedUserAndLogin(unique);

		const trip = await prisma.trips.create({
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

		const res = await request(app).post(`/trips/${trip.trip_id}/readings/record`)
		.set('Authorization', `Bearer ${token}`).send(buildReadingPayload());

		expect(res.status).toBe(201);

		const readings = await prisma.trip_readings.findMany({
			where: { trip_id: trip.trip_id },
		});

		expect(readings).toHaveLength(1);
		expect(Number(readings[0].speed_kmh)).toBeCloseTo(60.5, 1);
		expect(Number(readings[0].latitude)).toBeCloseTo(-25.77116, 3);
		expect(Number(readings[0].longitude)).toBeCloseTo(28.29979, 3);
		expect(readings[0].data_source).toBe('PHONE');
	});

	it('accumulates multiple readings for the same trip', async () => {
		const unique = Date.now();
		const { user, vehicle, token } = await seedUserAndLogin(unique);

		const trip = await prisma.trips.create({
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

		//5 readings arriving 1 second apart
		for(let i = 0; i < 5; i++){
			const res = await request(app).post(`/trips/${trip.trip_id}/readings/record`)
			.set('Authorization', `Bearer ${token}`).send(
				buildReadingPayload({
					recorded_at: new Date(Date.now() + i * 1000).toISOString(),
					speed_kmh: 60 + i,
				})
			);
			expect(res.status).toBe(201);
		};

		const readings = await prisma.trip_readings.findMany({
			where: { trip_id: trip.trip_id },
		});
		
		expect(readings).toHaveLength(5);
	});

	it('records OBD data with DTC codes', async () => {
		const unique = Date.now();
		const { user, vehicle, token } = await seedUserAndLogin(unique);

		const trip = await prisma.trips.create({
			data: {
				user_id: user.user_id,
				vehicle_id: vehicle,
				status: 'IN_PROGRESS',
				start_time: new Date(),
				start_latitude: -25.77116,
				start_longitude: 28.29979,
				data_source: 'OBD',
			},
		});

		const res = await request(app).post(`/trips/${trip.trip_id}/readings/record`)
		.set('Authorization', `Bearer ${token}`).send(buildReadingPayload({
			data_source: 'OBD',
			rpm: 3500,
			coolant_temp_c: 105.0,
			dtc_codes: ['P0420', 'P0301'],
		}));

		expect(res.status).toBe(201);

		const readings = await prisma.trip_readings.findMany({
			where: { trip_id: trip.trip_id },
		});

		expect(readings).toHaveLength(1);
		expect(readings[0].dtc_codes).toContain('P0420');
		expect(readings[0].dtc_codes).toContain('P0301');
		expect(readings[0].data_source).toBe('OBD');
	});

	it('returns 404 when trip does not exist', async () => {
		const unique = Date.now();
		const {token} = await seedUserAndLogin(unique);	

		const res = await request(app).post('/trips/00000000-0000-0000-0000-000000000000/readings/record')
		.set('Authorization', `Bearer ${token}`).send(buildReadingPayload());

		expect(res.status).toBe(404);
		expect(res.body.error).toBe('TRIP_NOT_FOUND');
		expect(res.body.message).toBe('Trip not found');

	});

	it('returns 401 when no token is provided', async () => {
		const res = await request(app).post('/trips/00000000-0000-0000-0000-000000000000/readings/record')
		.send(buildReadingPayload());

		expect(res.status).toBe(401);
	});

	it('returns 500 for an unexpected internal error', async () => {
		const unique = Date.now();
		const { user, vehicle, token } = await seedUserAndLogin(unique);

		const trip = await prisma.trips.create({
			data: {
				user_id: user.user_id,
				vehicle_id: vehicle,
				status: 'IN_PROGRESS',
				start_time: new Date(),
				start_latitude: -25.77116,
				start_longitude: 28.29979,
				data_source: 'OBD',
			},
		});

		const res = await request(app).post(`/trips/${trip.trip_id}/readings/record`)
		.set('Authorization', `Bearer ${token}`).send(buildReadingPayload({
			speed_kmh: 'not-a-number'
		}));

		expect(res.status).toBe(500);
		expect(res.body.error).toBe('INTERNAL_SERVER_ERROR');
	});
});