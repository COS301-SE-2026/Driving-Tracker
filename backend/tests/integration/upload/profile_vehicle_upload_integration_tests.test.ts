import request from 'supertest';
import{ describe, expect, it, beforeEach, afterAll, jest} from '@jest/globals';
import { blob_storage_service } from '../../../src/services/blob_storage_service';

jest.mock('../../../src/services/blob_storage_service', () => ({
	blob_storage_service: {
		upload_image: jest.fn<any>().mockResolvedValue('uploaded-image.png'),
		delete_image: jest.fn<any>().mockResolvedValue(undefined),
		download: jest.fn<any>()
	}
}));

import app from '../../../src/app';
import prisma from '../../../src/db/prisma';
import { seedUserAndLogin, cleanTripsData } from '../helpers';
import { Readable } from 'stream';

describe('Profile, vehicle, and image endpoint integration tests', () => {
	beforeEach(async () => {
		await cleanTripsData();
		jest.clearAllMocks();
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
			expect(res.status).toBe(400);
			expect(res.body.error).toBe('INVALID_FILE_TYPE');
		});
	});

	describe('POST /upload/vehicle/:vehicle_id', () => {
		it('uploads a vehicle image successfully', async () => {
			const unique = Date.now();
			const { token, vehicle } = await seedUserAndLogin(unique);
			
			const res = await request(app).post(`/upload/vehicle/${vehicle}`)
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

			const res = await request(app).post(`/upload/vehicle/${otherVehicle}`).set('Authorization', `Bearer ${token}`)
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

			const res = await request(app).post(`/upload/vehicle/${vehicle}`).set('Authorization', `Bearer ${token}`);

			expect(res.status).toBe(400);
			expect(res.body.error).toBe('NO_FILE_PROVIDED');
		});
	});

	describe('GET /upload/profile-picture/:user_id', () => {
		it('returns the profile picture successfully', async () => {
			const unique = Date.now();
			const { user, token } = await seedUserAndLogin(unique);
			
			await prisma.users.update({
				where: { user_id: user.user_id },
				data: { profile_picture_url: 'profile-image.png' }
			});

			jest.spyOn(blob_storage_service, 'download').mockResolvedValueOnce({
				stream: Readable.from(Buffer.from('profile-image')),
				content_Type: 'image/png',
				content_length: 13
			});

			const res = await request(app).get(`/upload/profile-picture/${user.user_id}`)
				.set('Authorization', `Bearer ${token}`);
			
			expect(res.status).toBe(200);
			expect(res.headers['content-type']).toContain('image/png');
			expect(res.headers['content-length']).toBe('13');
			expect(res.body.toString()).toBe('profile-image');
			expect(blob_storage_service.download).toHaveBeenCalledWith('profile', 'profile-image.png');
		});

		it('returns 404 when the user has no profile picture', async() => {
			const unique = Date.now();
			const { user, token } = await seedUserAndLogin(unique);

			const res = await request(app).get(`/upload/profile-picture/${user.user_id}`).set('Authorization', `Bearer ${token}`);

			expect(res.status).toBe(404);
			expect(res.body.error).toBe('NOT_FOUND');
			expect(res.body.message).toBe('This user has no profile picture');
		});

		it('returns 401 without a token', async () => {
			const unique = Date.now();
			const { user } = await seedUserAndLogin(unique);

			const res = await request(app).get(`/upload/profile-picture/${user.user_id}`)
			expect(res.status).toBe(401);
			expect(res.body.error).toBe('UNAUTHORIZED');
		});
	});

	describe('GET /upload/vehicle-image/:vehicle_id', () => {
		it('returns the vehicle image successfully', async () => {
			const unique = Date.now();
			const { token, vehicle } = await seedUserAndLogin(unique);
			
			await prisma.vehicles.update({
				where: { vehicle_id: vehicle },
				data: { image_url: 'vehicle-image.png' }
			});

			jest.spyOn(blob_storage_service, 'download').mockResolvedValueOnce({
				stream: Readable.from(Buffer.from('vehicle-image')),
				content_Type: 'image/png',
				content_length: 13
			});

			const res = await request(app).get(`/upload/vehicle-image/${vehicle}`)
				.set('Authorization', `Bearer ${token}`);
			
			expect(res.status).toBe(200);
			expect(res.headers['content-type']).toContain('image/png');
			expect(res.headers['content-length']).toBe('13');
			expect(res.body.toString()).toBe('vehicle-image');
			expect(blob_storage_service.download).toHaveBeenCalledWith('vehicle', 'vehicle-image.png');
		});

		it('returns 404 when vehicle has no image', async() => {
			const unique = Date.now();
			const { token, vehicle } = await seedUserAndLogin(unique);

			const res = await request(app).get(`/upload/vehicle-image/${vehicle}`).set('Authorization', `Bearer ${token}`);

			expect(res.status).toBe(404);
			expect(res.body.error).toBe('NOT_FOUND');
			expect(res.body.message).toBe('This vehicle has no image');
		});

		it('returns 403 when vehicle is not owned by the user', async() => {
			const unique = Date.now();
			const { token } = await seedUserAndLogin(unique);
			const { vehicle: otherVehicle } = await seedUserAndLogin(unique+1);

			const res = await request(app).get(`/upload/vehicle-image/${otherVehicle}`).set('Authorization', `Bearer ${token}`);

			expect(res.status).toBe(403);
			expect(res.body.error).toBe('FORBIDDEN');
			expect(res.body.message).toBe('You do not own this vehicle');
		});

		it('returns 401 without a token', async () => {
			const unique = Date.now();
			const { vehicle } = await seedUserAndLogin(unique);

			const res = await request(app).get(`/upload/vehicle-image/${vehicle}`)
			expect(res.status).toBe(401);
			expect(res.body.error).toBe('UNAUTHORIZED');
		});
	});
});