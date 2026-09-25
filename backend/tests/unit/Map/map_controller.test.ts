import{ describe, it, expect, jest, beforeEach } from '@jest/globals';
import map_controller from '../../../src/controllers/map.controller';
import { map_services } from '../../../src/services/map_services';

describe('Map Controller get_road_defects', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    }); 

    const make_res = () => {
        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });
        return { status, json };
    };

    it('returns 200 OK with defects on valid query', async () => {
        const mock_defects = [
            { lat: -25.7461, lng: 28.2313, reports: 3, avg_severity: 3.8, distance_m: 20.5, bearing_deg: 45.0},
        ];

        jest.spyOn(map_services, 'get_road_defects').mockResolvedValue(mock_defects);

        const req: any = {
            user: { sub: 'user-1' },
            query: { lat: '-25.7461', lng: '28.2313', heading: '45' },
        };
        const res: any = make_res();

        await map_controller.get_road_defects(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Road defects retrieved successfully',
            data: {
                radius_m: 100,
                defects: mock_defects,
            },
        });
    });

    it('returns 400 for missing or invalid coordinates', async () => {
        const req: any = {
            user: { sub: 'user-1' },
            query: { lat: 'invalid', lng: '28.2313' },
        };
        const res: any = make_res();

        await map_controller.get_road_defects(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'INVALID_COORDINATES',
            message: 'Valid latitude and longitude are required',
        });
    });

    it('returns 400 for out-of-range heading', async () => {
        const req: any = {
            user: { sub: 'user-1' },
            query: { lat: '-25.7461', lng: '28.2313', heading: '400' },
        };
        const res: any = make_res();

        await map_controller.get_road_defects(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'INVALID_HEADING',
            message: 'Heading must be a number between 0 and 359.99',
        });
    });

    it('returns 401 if user is not authorized', async () => {
        const req: any = {
            query: { lat: '-25.7461', lng: '28.2313' },
        };
        const res: any = make_res();

        await map_controller.get_road_defects(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: 'UNAUTHORIZED',
            message: 'Cannot access map services',
        });
    });
});