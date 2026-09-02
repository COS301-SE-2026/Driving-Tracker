import {describe, expect, it, jest, beforeEach } from '@jest/globals';
import { upload_controller } from '../../../src/controllers/upload.controller';
import { blob_storage_service } from '../../../src/services/blob_storage_service';
import { auth_services } from '../../../src/services/auth_services';
import { vehicle_services } from '../../../src/services/vehicle.services';
import { ExtendedError } from '../../../src/utils/errors';
import { blob } from 'stream/consumers';

describe('Upload controller', () => {
	beforeEach(() => {
		jest.restoreAllMocks();
	});

	describe('upload_profile_picture', () => {
		it('uploads a profile picture successfully', async () => {
			const file = {
				buffer: Buffer.from('fake-image'),
				mimetype: 'image/png',
				originalname: 'profile.png'
			};

			jest.spyOn(blob_storage_service, 'upload_image').mockResolvedValueOnce('profile-image.png');

			jest.spyOn(auth_services, 'update_profile_picture').mockResolvedValueOnce({
				display_url: 'upload/profile-picture/user-1',
				previous_blob_name: 'old-profile.png',
				updated_blob_name: 'profile-image.png'
			});

			const deleteImage = jest.spyOn(blob_storage_service, 'delete_image').mockResolvedValueOnce();

			const req: any = {
				user: { sub: 'user-1'},
				file
			};

			const json = jest.fn();
			const status = jest.fn().mockReturnValue({ json });
			const res: any = { status };

			await upload_controller.upload_profile_picture(req, res);
			expect(blob_storage_service.upload_image).toHaveBeenCalledWith(file, 'profile');
			expect(auth_services.update_profile_picture).toHaveBeenCalledWith('user-1', 'profile-image.png');
			expect(deleteImage).toHaveBeenCalledWith('profile', 'old-profile.png');
			expect(status).toHaveBeenCalledWith(200);
			expect(json).toHaveBeenCalledWith({
				message: 'Profile picture uploaded successfully',
				data: {
					profile_picture_url: 'upload/profile-picture/user-1'
				}
			});
		});

		it('returns 401 when the user id is missing', async () => {
			const req: any = {
				user: {},
				file: {
					buffer: Buffer.from('fake-image'),
					mimetype: 'image/png'
				}
			};

			const json = jest.fn();
			const status = jest.fn().mockReturnValue({ json });
			const res: any = { status };

			await upload_controller.upload_profile_picture(req, res);

			expect(status).toHaveBeenCalledWith(401);
			expect(json).toHaveBeenCalledWith({
				error: 'UNAUTHORIZED'
			});
		});

		it('returns 400 when no file is provided', async () => {
			const req: any = {
				user: { sub: 'user-1' }
			};

			const json = jest.fn();
			const status = jest.fn().mockReturnValue({ json });
			const res: any = { status };

			await upload_controller.upload_profile_picture(req, res);

			expect(status).toHaveBeenCalledWith(400);
			expect(json).toHaveBeenCalledWith({
				error: 'NO_FILE_PROVIDED',
				message: 'No image file was provided'
			});
		});

		it('returns 400 for an invalid file type', async () => {
			jest.spyOn(blob_storage_service, 'upload_image').mockRejectedValueOnce(
				new ExtendedError(
					'Unsupported image type',
					"INVALID_FILE_TYPE"
				)
			);

			const req: any = {
				user: { sub: 'user-1' },
				file: {
					buffer: Buffer.from('fake-file'),
					mimetype: 'text/plain'
				}
			};

			const json = jest.fn();
			const status = jest.fn().mockReturnValue({ json });
			const res: any = { status };

			await upload_controller.upload_profile_picture(req, res);
			expect(status).toHaveBeenCalledWith(400);
			expect(json).toHaveBeenCalledWith({
				error: "INVALID_FILE_TYPE",
				message: 'Only jpeg, jpg, png, and webp images are allowed'
			});
		});
	});

	describe('upload_vehicle_image', () => {
		it('uploads vehicle image successfully', async () => {
			const file = {
				buffer: Buffer.from('fake-image'),
				mimetype: 'image/jpeg',
				originalname: 'vehicle.jpg'
			};

			jest.spyOn(blob_storage_service, 'upload_image').mockResolvedValueOnce('vehicle-image.jpg');
			jest.spyOn(vehicle_services, 'update_vehicle_image').mockResolvedValueOnce({
				display_url: 'upload/vehicle-image/vehicle-1',
				previous_blob_name: 'old-vehicle.jpg'
			});

			const deleteImage = jest.spyOn(blob_storage_service, 'delete_image').mockResolvedValueOnce();

			const req: any = {
				user: { sub: 'user-1' },
				params: { vehicle_id: 'vehicle-1' },
				file
			};

			const json = jest.fn();
			const status = jest.fn().mockReturnValue({ json });
			const res: any = { status };

			await upload_controller.upload_vehicle_image(req, res);

			expect(blob_storage_service.upload_image).toHaveBeenCalledWith(file, 'vehicle');
			expect(vehicle_services.update_vehicle_image).toHaveBeenCalledWith(
				'user-1',
				'vehicle-1',
				'vehicle-image.jpg'
			);

			expect(deleteImage).toHaveBeenCalledWith('vehicle', 'old-vehicle.jpg');
			expect(status).toHaveBeenCalledWith(200);
			expect(json).toHaveBeenCalledWith({
				message: 'Vehicle image uploaded successfully',
				data: {
					image_url: 'upload/vehicle-image/vehicle-1'
				}
			});
		});

		it('returns 401 when the user id is missing', async () => {
			const req: any = {
				user: {},
				params: { vehicle_id: 'vehicle-1' },
				file: {
					buffer: Buffer.from('fake-image'),
					mimetype: 'image/png'
				}
			};

			const json = jest.fn();
			const status = jest.fn().mockReturnValue({ json });
			const res: any = { status };

			await upload_controller.upload_vehicle_image(req, res);

			expect(status).toHaveBeenCalledWith(401);
			expect(json).toHaveBeenCalledWith({
				error: 'UNAUTHORIZED'
			});
		});

		it('returns 400 when no file is provided', async () => {
			const req: any = {
				user: { sub: 'user-1' },
				params: { vehicle_id: 'vehicle-1' }
			};

			const json = jest.fn();
			const status = jest.fn().mockReturnValue({ json });
			const res: any = { status };

			await upload_controller.upload_vehicle_image(req, res);

			expect(status).toHaveBeenCalledWith(400);
			expect(json).toHaveBeenCalledWith({
				error: 'NO_FILE_PROVIDED',
				message: 'No image file was provided'
			});
		});

		it('returns 403 when the vehicle is not owned by the user', async () => {
			jest.spyOn(blob_storage_service, 'upload_image').mockResolvedValueOnce('vehicle-image.png');

			jest.spyOn(vehicle_services, 'update_vehicle_image').mockRejectedValueOnce(
				new Error('You do not own this vehicle')
			);

			const req: any = {
				user: {sub: 'user-1' },
				params: { vehicle_id: 'vehicle-1' },
				file: {
					buffer: Buffer.from('fake-image'),
					mimetype: 'image/png'
				}
			}; 

			const json = jest.fn();
			const status = jest.fn().mockReturnValue({ json });
			const res: any = { status };

			await upload_controller.upload_vehicle_image(req, res);

			expect(status).toHaveBeenCalledWith(403);
			expect(json).toHaveBeenCalledWith({
				error: 'FORBIDDEN',
				message: 'You do not own this vehicle'
			});
		});
	});

	describe('upload_profile_picture errors', () => {
		it('returns 404 when user is not found', async () => {
			jest.spyOn(blob_storage_service, 'upload_image').mockResolvedValueOnce('img.png');
			jest.spyOn(auth_services, 'update_profile_picture').mockRejectedValueOnce(
				new ExtendedError("User not found", "USER_NOT_FOUND")
			);

			const req: any = { user: { sub: 'user-1' }, file: { buffer: Buffer.from(''), mimetype: 'image/png'}};
			const json = jest.fn();
			const res: any = { status: jest.fn().mockReturnValue({ json })};

			await upload_controller.upload_profile_picture(req, res);
			expect(res.status).toHaveBeenCalledWith(404);
		});

		it('returns 500 on unexpected failure', async () => {
			jest.spyOn(blob_storage_service, 'upload_image').mockRejectedValueOnce(new Error('Storage down'));

			const req: any = { user: { sub: 'user-1' }, file: { buffer: Buffer.from(''), mimetype: 'image/png'}};
			const json = jest.fn();
			const res: any = { status: jest.fn().mockReturnValue({ json })};

			await upload_controller.upload_profile_picture(req, res);
			expect(res.status).toHaveBeenCalledWith(500);
		});
	});

	describe('get_profile_picture', () => {
		it('pipes the blob stream to the response', async () => {
			jest.spyOn(auth_services, 'get_profile_picture_blob_name').mockResolvedValueOnce('blob-123.png');
			const pipe = jest.fn();
			jest.spyOn(blob_storage_service, 'download').mockResolvedValueOnce({
				stream: { pipe } as any,
				content_Type: 'image/png',
				content_length: 5000
			});
			

			const req: any = { user: { sub: 'user-1' }, params: { user_id: 'user-1'}};
			const res: any = { setHeader: jest.fn() };

			await upload_controller.get_profile_picture(req, res);
			expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'image/png');
			expect(pipe).toHaveBeenCalledWith(res);
		});

		it('returns 404 if no blob name exists', async () => {
			jest.spyOn(auth_services, 'get_profile_picture_blob_name').mockResolvedValueOnce(null);

			const req: any = { user: { sub: 'user-1' }, params: { user_id: 'user-1'}};
			const json = jest.fn();
			const res: any = { status: jest.fn().mockReturnValue({ json })};

			await upload_controller.get_profile_picture(req, res);
			expect(res.status).toHaveBeenCalledWith(404);
		});
	});
});