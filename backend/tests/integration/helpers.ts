import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../../src/app';
import prisma from '../../src/db/prisma';

export const seedUserAndLogin = async (unique: number) => {
	const password = 'Password123!';
	const password_hash = await bcrypt.hash(password, 10);

	const user = await prisma.users.create({
		data: {
			email: `trips_user_${unique}@gmail.com`,
				username: `trips_user_${unique}`,
				name: 'Trip',
				surname: 'Tester',
				dob: new Date('2000-01-01'),
				phone_number: '+27123456789',
				password_hash,
				consent_status: true,
		},
	});

	const loginRes = await request(app).post('/api/auth/login').send({
		identifier: `trips_user_${unique}`, 
		password,
	});

	return { user, token: loginRes.body.token as string };
};

export const cleanTripsData = async () => {
	await prisma.trip_events.deleteMany;
	await prisma.trip_location_shares.deleteMany;
	await prisma.trip_readings.deleteMany;
	await prisma.trip_scores.deleteMany;
	await prisma.trips.delete;
	await prisma.users.delete;
};