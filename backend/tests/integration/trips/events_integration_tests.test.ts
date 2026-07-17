import request from 'supertest';
import { describe, expect, it, afterAll, beforeEach } from '@jest/globals';
import app from '../../../src/app';
import prisma from '../../../src/db/prisma';
import { seedUserAndLogin, cleanTripsData } from '../helpers';

describe('POST /trips/:trip_id/events/log integration test', () =>{
	beforeEach(async () => {
		await cleanTripsData();
	})

	afterAll(async () => {
		await prisma.$disconnect();
	});

	it('logs a harsh event and writes it to the trip_events table', async () => {
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

		const res = await request(app).post(`/trips/${trip.trip_id}/events/log`)
		.set('Authorization', `Bearer ${token}`).send({
			event_type: 'HARSH_BRAKE',
			location: {
				lat: -25.77116,
				lng: 28.29979,
			},
			severity: 7.5,
			sensor_source: 'ACCELEROMETER',
			timestamp: new Date().toISOString(),
		});

		expect(res.status).toBe(201);
		expect(res.body.data.event_id).toBeDefined();
		expect(res.body.data.trip_id).toBe(trip.trip_id);
		expect(res.body.data.type).toBe('HARSH_BRAKE');

		const events = await prisma.trip_events.findMany({
			where: { trip_id: trip.trip_id },
		});

		expect(events).toHaveLength(1);
		expect(events[0].type).toBe('HARSH_BRAKE');
		expect(Number(events[0].severity)).toBe(7.5);
		expect(events[0].sensor_source).toBe('ACCELEROMETER');
	});

	it('logs multiple different event types for the same trip', async () => {
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

		const eventTypes = ['HARSH_BRAKE', 'HARSH_ACCELERATION', 'SHARP_CORNER', 'CRASH_LIKE'];
		for(const event_type of eventTypes){
			const res = await request(app).post(`/trips/${trip.trip_id}/events/log`)
			.set('Authorization', `Bearer ${token}`)
			.send({
				event_type,
				location: {
					lat: -25.77116,
					lng: 28.29979
				},
				severity: 6.0,
				sensor_source: 'ACCELEROMETER',
				timestamp: new Date().toISOString(),
			});

			expect(res.status).toBe(201);
		}

		const events = await prisma.trip_events.findMany({
			where: { trip_id: trip.trip_id },
		});

		expect(events).toHaveLength(4);
		const types = events.map((e) => e.type);
		expect(types).toContain('HARSH_BRAKE');
		expect(types).toContain('HARSH_ACCELERATION');
		expect(types).toContain('SHARP_CORNER');
		expect(types).toContain('CRASH_LIKE');
	});

	it('returns 400 for an invalid event type and writes nothing to database', async () => {
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

		const res = await request(app).post(`/trips/${trip.trip_id}/events/log`)
		.set('Authorization', `Bearer ${token}`).send({
			event_type: 'NOT_A_REAL_EVENT',
				location: {
					lat: -25.77116,
					lng: 28.29979
				},
				severity: 5.0,
				sensor_source: 'ACCELEROMETER',
				timeStamp: new Date().toISOString(),
		});

		expect(res.status).toBe(400);
		expect(res.body.error).toBe('INVALID_EVENT_TYPE');
		
		const events = await prisma.trip_events.findMany({
			where: { trip_id: trip.trip_id },
		});
		expect(events).toHaveLength(0);
	});

	it('returns 403 when a user does not own the trip', async () => {
		const uniqueA = Date.now();
		const uniqueB = uniqueA + 1;
		const {token} = await seedUserAndLogin(uniqueA);

		const { user: otherUser, vehicle: otherVehicle } = await seedUserAndLogin(uniqueB);

		const trip = await prisma.trips.create({
			data: {
				user_id: otherUser.user_id,
				vehicle_id: otherVehicle,
				status: 'IN_PROGRESS',
				start_time: new Date(),
				start_latitude: -25.77116,
				start_longitude: 28.29979,
				data_source: 'PHONE',
			},
		});

		const res = await request(app).post(`/trips/${trip.trip_id}/events/log`)
		.set('Authorization', `Bearer ${token}`).send({
			event_type: 'HARSH_BRAKE',
				location: {
					lat: -25.77116,
					lng: 28.29979
				},
				severity: 7.5,
				sensor_source: 'ACCELEROMETER',
				timeStamp: new Date().toISOString(),
		});

		expect(res.status).toBe(403);
		expect(res.body.error).toBe('FORBIDDEN');
		expect(res.body.message).toBe('You do not own this trip');

		const events = await prisma.trip_events.findMany({
			where: { trip_id: trip.trip_id },
		});
		expect(events).toHaveLength(0);
	});

	it('returns 403 when a user does not own the trip', async () => {
		const unique = Date.now();
		const {token} = await seedUserAndLogin(unique);

		const res = await request(app).post('/trips/00000000-0000-0000-0000-000000000000/events/log')
		.set('Authorization', `Bearer ${token}`).send({
			event_type: 'HARSH_BRAKE',
				location: {
					lat: -25.77116,
					lng: 28.29979
				},
				severity: 7.5,
				sensor_source: 'ACCELEROMETER',
				timeStamp: new Date().toISOString(),
		});
		expect(res.status).toBe(404);
		expect(res.body.error).toBe('TRIP_NOT_FOUND');
	});

	it('returns 401 when a user is unauthorized or no token is provided', async () => {
		const res = await request(app).post('/trips/00000000-0000-0000-0000-000000000000/events/log')
		.send({
			event_type: 'HARSH_BRAKE',
				location: {
					lat: -25.77116,
					lng: 28.29979
				},
				severity: 7.5,
				sensor_source: 'ACCELEROMETER',
				timeStamp: new Date().toISOString(),
		});
		
		expect(res.status).toBe(401);
	});
});