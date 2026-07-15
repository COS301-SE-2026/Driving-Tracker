import request from 'supertest';
import { describe, expect, it, afterAll, beforeEach } from '@jest/globals';
import app from '../../../src/app';
import prisma from '../../../src/db/prisma';
import { seedUserAndLogin, cleanTripsData } from '../helpers';
import bcrypt from 'bcrypt';

describe('PATCH trips/end_trip integration test', () => {
	beforeEach(async () => {
		await cleanTripsData();
	});

	afterAll(async () => {
		await prisma.$disconnect();
	});

	it('marks a trip as completed and writes trip scores', async() => {
		const unique = Date.now();
		const {user, vehicle, token } = await seedUserAndLogin(unique);
		
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

		const res = await request(app).patch(`/trips/${trip.trip_id}/end_trip`)
		.set('Authorization', `Bearer ${token}`).send({
			trip_id: trip.trip_id,
			endtime: new Date().toISOString(),
			route_polyline: 'mock_polyline',
			distance_km: 14.2,
			duration_minutes: 22,
            fuel_estimate: 1.4,
            status: 'COMPLETED',
            safety_score: 88,
            eco_score: 76,
            overall_score: 82,
		});

		expect(res.status).toBe(200);
		expect(res.body.data.trip_id).toBe(trip.trip_id);
		expect(res.body.data.status).toBe('COMPLETED');

		const updatedTrip = await prisma.trips.findUnique({
			where: { trip_id: trip.trip_id },
		});

		expect(updatedTrip?.status).toBe('COMPLETED');
		expect(Number(updatedTrip?.distance_km)).toBeCloseTo(14.2, 1);

		const scores = await prisma.trip_scores.findFirst({
			where: { trip_id: trip.trip_id },
		});

		expect(scores).not.toBeNull();
		expect(Number(scores?.safety_score)).toBe(88);
		expect(Number(scores?.eco_score)).toBe(76);
		expect(Number(scores?.overall_score)).toBe(82);
	});

	it('returns 403 when a user does not own that trip', async () => {
		const unique = Date.now();
		const password = 'Password123!';
		const password_hash = await bcrypt.hash(password, 10);
		const { token } = await seedUserAndLogin(unique);

		const otherUser = await prisma.users.create({
			data: {
				email: `other_${unique}@gmail.com`,
				username: `other_${unique}`,
				name: 'Other',
				surname: 'User',
				dob: new Date('2000-01-01'),
				phone_number: '+27123456789',
				password_hash,
				consent_status: true,
			},
		});
		const trip = await prisma.trips.create({
			data: {
				user_id: otherUser.user_id,
				status: 'IN_PROGRESS',
				start_time: new Date(),
				start_latitude: -25.77116,
				start_longitude: 28.29979,
				data_source: 'PHONE',
			},
		});

		const res = await request(app).patch(`/trips/${trip.trip_id}/end_trip`)
		.set('Authorization', `Bearer ${token}`).send({
			trip: trip.trip_id,
			end_time: new Date().toISOString(),
			route_polyline: 'mock_polyline',
			distance_km: 14.2,
			duration_minutes: 22,
			fuel_estimate: 1.4,
			status: 'COMPLETED',
			safety_score: 88,
			eco_score: 76,
			overall_score: 82,
		});

		expect(res.status).toBe(403);
		expect(res.body).toEqual({
			error: 'FORBIDDEN',
			message: 'You do not own this trip',
		});
	});

	it('returns 404 when a trip is not found', async () => {
		const unique = Date.now();
		const { token } = await seedUserAndLogin(unique);

		const res = await request(app).patch(`/trips/00000000-0000-0000-0000-000000000000/end_trip`)
		.set('Authorization', `Bearer ${token}`).send({
			trip: '00000000-0000-0000-0000-000000000000',
			end_time: new Date().toISOString(),
			route_polyline: 'mock_polyline',
			distance_km: 14.2,
			duration_minutes: 22,
			fuel_estimate: 1.4,
			status: 'COMPLETED',
			safety_score: 88,
			eco_score: 76,
			overall_score: 82,
		});

		expect(res.status).toBe(404);
		expect(res.body).toEqual({
			error: 'TRIP_NOT_FOUND',
			message: 'Trip npt found',
		});
	});

	it('returns 409 when the trip is already completed', async () => {
		const unique = Date.now();
		const { user, vehicle, token } = await seedUserAndLogin(unique);

		const trip = await prisma.trips.create({
			data: {
				user_id: user.user_id,
				vehicle_id: vehicle,
				status: 'COMPLETED',
				start_time: new Date(),
				end_time: new Date(),
				start_latitude: -25.77116,
				start_longitude: 28.29979,
				data_source: 'PHONE',
			},
		});

		const res = await request(app).patch(`/trips/${trip.trip_id}/end_trip`)
		.set('Authorization', `Bearer ${token}`).send({
			trip: trip.trip_id,
			end_time: new Date().toISOString(),
			route_polyline: 'mock_polyline',
			distance_km: 14.2,
			duration_minutes: 22,
			fuel_estimate: 1.4,
			status: 'COMPLETED',
			safety_score: 88,
			eco_score: 76,
			overall_score: 82,
		});

		expect(res.status).toBe(409);
	});
});