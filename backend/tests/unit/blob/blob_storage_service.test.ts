import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { blob_storage_service } from '../../../src/services/blob_storage_service';
import { ExtendedError } from '../../../src/utils/errors';

const mockDeleteIfExists = jest.fn<() => Promise<unknown>>();
const mockDownload = jest.fn<() => Promise<any>>();
const mockUploadData = jest.fn<(buf: any, opts: any) => Promise<unknown>>();

jest.mock('@azure/storage-blob', () => ({
	BlobServiceClient: {
		fromConnectionString: jest.fn().mockReturnValue({
			getContainerClient: jest.fn().mockReturnValue({
				getBlockBlobClient: jest.fn().mockReturnValue({
					uploadData: ( buf: any, opts: any ) => mockUploadData(buf, opts),
					download: () => mockDownload(),
					deleteIfExists: () => mockDeleteIfExists()
				})
			})
		})
	}
}));

describe('Blob storage service', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('upload_image', () => {
		it('uploads a profile image successfully', async () => {
			mockUploadData.mockResolvedValueOnce({});
			const file = { buffer: Buffer.from('test'), mimetype: 'image/png' };
			const result = await blob_storage_service.upload_image(file, 'profile');
			expect(result).toMatch(/\.png$/);
		});

		it('throws for unsupported mimetype', async () => {
			const file = { buffer: Buffer.from('test'), mimetype: 'text/plain' };
			await expect(blob_storage_service.upload_image(file, 'profile')).rejects.toThrow(ExtendedError);
		});
	});

	describe('download', () => {
		it('downloads a blob successfully', async () => {
			const mockStream = {} as NodeJS.ReadableStream;
			mockDownload.mockResolvedValueOnce({
				readableStreamBody: mockStream,
				contentType: 'image/jpeg',
				contentLength: 100
			});

			const result = await blob_storage_service.download('profile', 'blob.jpg');
			expect(result.content_Type).toBe('image/jpeg');
		});

		it('throws if stream is missing', async () => {
			mockDownload.mockResolvedValueOnce({ readableStream: null });
			await expect(blob_storage_service.download('profile', 'blob.jpg'))
				.rejects.toThrow("Image could not be read from storage");
		});
	});

	describe('delete_image', () => {
		it('deletes an existing blob', async () => {
			mockDeleteIfExists.mockResolvedValueOnce({});
			await blob_storage_service.delete_image('profile', 'blob.png');
			expect(mockDeleteIfExists).toHaveBeenCalledWith();
		});

		it('returns early if blob name is missing', async () => {
			await blob_storage_service.delete_image('profile', null);
			expect(mockDeleteIfExists).not.toHaveBeenCalled();
		});
	});
});
