import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../../src/app';
import prisma from '../../src/db/prisma';

function getTestPassword(): string {
	const password = process.env.TEST_USER_PASSWORD;
	if(!password){
		throw new Error('TEST_USER_PASSWORD environment variable is required to run integration tests');
	}
	return password;
}

export const seedUserAndLogin = async (unique: number) => {
	const password = getTestPassword();
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

	const vehicle = await prisma.vehicles.create({
		data:{
			registration: `TEST-${unique}`,
			make: 'BMW',
			model: 'M3',
			year: 2022,
			fuel_type: 'PETROL',
		},
	});

	await prisma.users_vehicles.create({
		data: {
			user_id: user.user_id,
			vehicle_id: vehicle.vehicle_id,
		},
	});

	const loginRes = await request(app).post('/api/auth/login').send({
		identifier: `trips_user_${unique}`, 
		password,
	});

	return { user, vehicle: vehicle.vehicle_id, token: loginRes.body.token as string };
};

export const cleanTripsData = async () => {
	await prisma.trip_events.deleteMany();
	await prisma.trip_location_shares.deleteMany();
	await prisma.trip_readings.deleteMany();
	await prisma.trip_scores.deleteMany();
	await prisma.trips.deleteMany();
	await prisma.users.deleteMany();
};