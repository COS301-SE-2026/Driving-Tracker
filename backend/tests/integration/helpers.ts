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

export const seedContactUser = async (unique: number) => {
	const password = getTestPassword();
	const password_hash = await bcrypt.hash(password, 10);

	return prisma.users.create({
		data: {
			email: `contact_person_${unique}@gmail.com`,
			username: `contact_person_${unique}`,
			name: 'Contact',
			surname: 'Person',
			dob: new Date('1995-06-15'),
			phone_number: '+27987654321',
			password_hash,
			consent_status: true,
		},
	});
};

export const seedApprovedContact = async (
	owner_user_id: string, 
	contact_user_id: string,
	contact_email: string 
) => {
		return prisma.trusted_contacts.create({
			data: {
				user_id: owner_user_id,
				contact_user_id,
				name: 'Contact Person',
				email: contact_email,
				consent_status: 'APPROVED',
			},
		});
};

export const seedTrip = async(
	user_id: string,
	vehicle_id: string
) => {
	return prisma.trips.create({
		data: {
			user_id,
			vehicle_id,
			status: 'IN_PROGRESS',
			start_time: new Date(),
			start_latitude: -25.77116,
			start_longitude: 28.29979,
			data_source: 'PHONE',
		},
	});
};

export const seedTripEVent = async(trip_id: string) => {
	return prisma.trip_events.create({
		data: {
			trip_id,
			type: "HARSH_BRAKE",
			severity: 7.5,
			sensor_source: 'ACCELEROMETER',
			recorded_at: new Date(),
			latitude: -25.77116,
			longitude: 28.29979,
		},
	});
};

export const seedBadge = async(name: string, category: string = 'SAFETY') => {
	return prisma.badges.create({
		data: {
			name, 
			description: `Description for ${name}`,
			category,
			icon_url: `http://example.com/icons/${name.toLowerCase().replace(' ', '_')}.png`
		}
	});
};

export const seedBadgeCriteria = async(badge_id: string, metric: string, operator: string, threshold: number) => {
	return prisma.badge_criteria.create({
		data: {
			badge_id,
			metric,
			operator,
			threshold
		}
	});
};

export const cleanDatabase = async () => {
	await prisma.notifications.deleteMany();
	await prisma.user_devices.deleteMany();
	await prisma.alert_notifications.deleteMany();
	await prisma.alerts.deleteMany();
	await prisma.trip_location_shares.deleteMany();
	await prisma.trip_events.deleteMany();
	await prisma.trip_scores.deleteMany();
	await prisma.trip_readings.deleteMany();
	await prisma.trips.deleteMany();
	await prisma.trusted_contacts.deleteMany();
	await prisma.badge_criteria.deleteMany();
	await prisma.user_badges.deleteMany();
	await prisma.badges.deleteMany();
	await prisma.leaderboard.deleteMany();
	await prisma.vehicles.deleteMany();
	await prisma.users_vehicles.deleteMany();
	await prisma.users.deleteMany();
};

export const cleanTripsData = cleanDatabase;


