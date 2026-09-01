import {describe, expect, it, jest, beforeEach } from '@jest/globals';
import { upload_controller } from '../../../src/controllers/upload.controller';
import { blob_storage_service } from '../../../src/services/blob_storage_service';
import { auth_services } from '../../../src/services/auth_services';
import { vehicle_services } from '../../../src/services/vehicle.services';
import { ExtendedError } from '../../../src/utils/errors';
import { buffer } from 'stream/consumers';

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

		
	});
})