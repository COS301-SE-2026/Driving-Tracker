import request from 'supertest';
import{ describe, expect, it, beforeEach, afterAll, jest} from '@jest/globals';
import { blob_storage_service } from '../../../src/services/blob_storage_service';

jest.mock('../../../src/services/blob_storage_service', () => ({
	blob_storage_service: {
		upload_image: jest.fn().mockResolvedValue('uploaded-image.png'),
		delete_image: jest.fn().mockResolvedValue(undefined),
		download: jest.fn()
	}
}));

import app from '../../../src/app';
import prisma from '../../../src/db/prisma';
import { seedUserAndLogin, cleanTripsData } from '../helpers';

describe('Profile, vehicle, and image endpoint integration tests', () => {
	beforeEach(async () => {
		await cleanTripsData();
	});

	afterAll(async () => {
		await prisma.$disconnect();
	});

	describe('POST /upload/profile', () => {
		it('uploads a profile picture successfully', async () => {
			const unique = Date.now();
			const { user, token } = await seedUserAndLogin(unique);
			const res = await request(app).post('/upload/profile')
				.set('Authorization', `Bearer ${token}`).attach('image', Buffer.from('fake-png-image'), {
					filename: 'profile.png',
					contentType: 'image/png'
				});
			
			expect(res.status).toBe(200);
			expect(res.body.message).toBe('Profile picture uploaded successfully');
			expect(res.body.data.profile_picture_url).toBe(`upload/profile-picture/${user.user_id}`);

			const savedUser = await prisma.users.findUnique({
				where: { user_id: user.user_id },
				select: { profile_picture_url: true }
			});
			
			expect(savedUser?.profile_picture_url).toBe('uploaded-image.png');
		});

		it('returns 400 when no image is attached', async() => {
			const unique = Date.now();
			const {token } = await seedUserAndLogin(unique);

			const res = await request(app).post('/upload/profile').set('Authorization', `Bearer ${token}`);

			expect(res.status).toBe(400);
			expect(res.body.error).toBe('NO_FILE_PROVIDED');
		});

		it('returns 400 for an unsupported file type', async () => {
			const unique = Date.now();
			const { token } = await seedUserAndLogin(unique);

			const res = await request(app).post('/upload/profile').set('Authorization', `Bearer ${token}`)
				.attach('image', Buffer.from('plain-text-file'), {
					filename: 'notes.txt',
					contentType: 'text/plain'
				});
			expect(res).toBe(400);
			expect(res.body.error).toBe('INVALID_FILE_TYPE');
		});
	});

	describe('POST /upload/vehicle/:vehicle_id', () => {
		it('uploads a vehicle image successfully', async () => {
			const unique = Date.now();
			const { token, vehicle } = await seedUserAndLogin(unique);
			
			const res = await request(app).post('/upload/vehicle')
				.set('Authorization', `Bearer ${token}`).attach('image', Buffer.from('fake-jpeg-image'), {
					filename: 'vehicle.png',
					contentType: 'image/png'
				});
			
			expect(res.status).toBe(200);
			expect(res.body.message).toBe('Vehicle image uploaded successfully');
			expect(res.body.data.image_url).toBe(`upload/vehicle-image/${vehicle}`);

			const savedVehicle = await prisma.vehicles.findUnique({
				where: { vehicle_id: vehicle },
				select: { image_url: true }
			});
			
			expect(savedVehicle?.image_url).toBe('uploaded-image.png');
		});

		it('returns 403 when the vehicle is not owned by the user', async() => {
			const unique = Date.now();
			const {token } = await seedUserAndLogin(unique);
			const { vehicle: otherVehicle } = await seedUserAndLogin(unique + 1);

			const res = await request(app).post('/upload/vehicle').set('Authorization', `Bearer ${token}`)
				.attach('image', Buffer.from('fake-png-image'), {
					filename: 'vehicle.png',
					contentType: 'image/png'
				});

			expect(res.status).toBe(403);
			expect(res.body.error).toBe('FORBIDDEN');
			expect(res.body.message).toBe('You do not own this vehicle');
		});

		it('returns 400 when no image is attached', async () => {
			const unique = Date.now();
			const { token, vehicle } = await seedUserAndLogin(unique);

			const res = await request(app).post('/upload/vehicle').set('Authorization', `Bearer ${token}`);

			expect(res).toBe(400);
			expect(res.body.error).toBe('NO_FILE_PROVIDED');
		});
	});

	

})