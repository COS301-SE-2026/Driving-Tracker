jest.mock('../../../src/services/notification_service');

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import notification_controller from '../../../src/controllers/notifications.controller';
import { notification_services } from '../../../src/services/notification_service';

describe('Notifications Controller', () => {
    beforeEach(() => {jest.clearAllMocks();});

    const make_res = () => {
        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });
        return { status, json };
    };

    describe('fetch notifications', () => {
        
        it('returns 200 and notifications on success', async ()=>{

            const mockNotifications = [
                {
                    notification_id: "noti-1",
                    user_id: "user-1",
                    type: "contact-request",
                    title: "Contact",
                    body: "request",
                    is_read: false,
                    reference_id: "contact-1",
                    reference_type: "trusted_contact",
                    created_at: "2026-03-03",
                },
                {
                    notification_id: "noti-2",
                    user_id: "user-1",
                    type: "contact-request",
                    title: "Contact",
                    body: "request",
                    is_read: false,
                    reference_id: "contact-2",
                    reference_type: "trusted_contact",
                    created_at: "2026-05-05",
                },
            ];

            jest.spyOn(notification_services, 'fetch_notifications').mockResolvedValueOnce(mockNotifications as any);

            const req: any = { user: {sub: 'u1'}};
            const res: any = make_res();

            await notification_controller.fetch_notifications(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Notifications retrieved successfully',
                data: {
                    notifications: mockNotifications,
                },
            }));
        });

        it('returns 401 when user is unauthenticated', async ()=>{

            const req: any = { user: { sub: null }};
            const res: any = make_res();

            await notification_controller.fetch_notifications(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({error: "UNAUTHORIZED"}); 
        });

        it('returns 500 when service throws unexpected error', async ()=>{

            jest.spyOn(notification_services, 'fetch_notifications').mockRejectedValueOnce(new Error('DB failed'));

            const req: any = { user: {sub: 'u1' }};
            const res: any = make_res();

            await notification_controller.fetch_notifications(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({error: "INTERNAL_SERVER_ERROR", message: 'DB failed'}); 
        });
    });

    describe('delete notifications', () => {
        
        it('returns 200 and deleted count on success', async ()=>{

            jest.spyOn(notification_services, 'delete_notifications').mockResolvedValueOnce(2);

            const req: any = { user: {sub: 'u1'}};
            const res: any = make_res();

            await notification_controller.delete_notifications(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Notifications deleted successfully',
                data: {
                    deleted_count: 2,
                },
            }));
        });

        it('returns 401 when user is unauthenticated', async ()=>{

            const req: any = { user: {sub: null }};
            const res: any = make_res();

            await notification_controller.delete_notifications(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({error: "UNAUTHORIZED"}); 
        });

        it('returns 500 when service throws unexpected error', async ()=>{

            jest.spyOn(notification_services, 'delete_notifications').mockRejectedValueOnce(new Error('DB failed'));

            const req: any = { user: {sub: 'u1' }};
            const res: any = make_res();

            await notification_controller.delete_notifications(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({error: "INTERNAL_SERVER_ERROR", message: 'DB failed'}); 
        });
    });
});