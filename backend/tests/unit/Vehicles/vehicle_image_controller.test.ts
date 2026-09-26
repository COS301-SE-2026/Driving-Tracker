import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { search_vehicle_image_controller } from '../../../src/controllers/vehicle.controller';
import * as vehicle_service_module from '../../../src/services/vehicle.services';

describe('Vehicle controller search_vehicle_image_controller', () => {
    beforeEach(() => {
        jest.restoreAllMocks();
    });

    const makeResponse = () => {
        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });
        return { status, json };
    };

    it('returns 401 when the user is not authenticated', async () => {
        const req: any = {
            user: undefined,
            query: { },
        };
        
        const res: any = makeResponse();

        await search_vehicle_image_controller(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: 'UNAUTHORIZED',
        });
    });

    it('returns 400 when the query is invalid', async () => {
        const req: any = {
            user: { sub: 'user-1'},
            query: {
                make: '',
                model: 'Corolla',
                year: '2021',
             },
        };
        
        const res: any = makeResponse();

        await search_vehicle_image_controller(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'INVALID_QUERY',
            message: 'Make, model and year are required.',
        });
    });

    it('returns 200 with the matching vehicle image', async () => {

        const image = {
            title: 'File:BMW M3.jpg',
            image_url: 'https://example.com/image.jpg',
            thumbnail_url: 'https://example.com/thumbnail.jpg'
        };

        const serviceSpy = jest.spyOn(vehicle_service_module, 'search_vehicle_image').mockResolvedValueOnce(image);

        const req: any = {
            user: { sub: 'user-1'},
            query: {
                make: 'BMW',
                model: 'M3',
                year: '2021',
             },
        };
        
        const res: any = makeResponse();

        await search_vehicle_image_controller(req, res);

        expect(serviceSpy).toHaveBeenCalledWith('BMW', 'M3', 2021);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: image,
        });
    });

    it('returns 500 when the image search fails', async () => {

        jest.spyOn(vehicle_service_module, 'search_vehicle_image').mockRejectedValueOnce(new Error('Image service unavailable'));

        const req: any = {
            user: { sub: 'user-1'},
            query: {
                make: 'BMW',
                model: 'M3',
                year: '2021',
             },
        };
        
        const res: any = makeResponse();

        await search_vehicle_image_controller(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: 'IMAGE_SEARCH_FAILED',
            message: 'Could not search for vehicle image.',
        });
    });
});