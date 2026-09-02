
jest.mock('../../../src/utils/firebase', () => ({
    getMessaging: jest.fn(),
}));

jest.mock('../../../src/db/prisma', () => ({
    __esModule: true,
    default: {
        users: {
            findFirst: jest.fn(),
        },
        user_devices: {
            findMany: jest.fn()
        },
        trusted_contacts: {
            findFirst: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        notifications: {
            createMany: jest.fn(),
            findMany: jest.fn(),
            deleteMany: jest.fn(),
        },
        $transaction: jest.fn(),
    },
}));

import {describe, it, expect, jest, beforeEach} from '@jest/globals';
jest.unmock('../../../src/services/notification_service')
import { getMessaging } from '../../../src/utils/firebase';
import { notification_services } from '../../../src/services/notification_service';
import prisma from '../../../src/db/prisma';

const mockGetMessaging = getMessaging as jest.Mock;
const mockSendEachForMulticast = jest.fn() as any;
const mock_prisma = prisma as any ;

describe('notification_services', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetMessaging.mockReturnValue({
            sendEachForMulticast: mockSendEachForMulticast,
        });
    });

    describe('send_trusted_contact_request_notification', () => {
        it('sends the trusted contact request notification', async () => {
            mockSendEachForMulticast.mockResolvedValue(undefined);

            await notification_services.send_trusted_contact_request_notification(
                ['token-1'],
                'John Doe',
                'c1'
            );

            expect(mockSendEachForMulticast).toHaveBeenCalledWith({
                fids: ['token-1'],
                notification: {
                    title: 'Trusted Contact Request',
                    body: 'John Doe wants to add you as a trusted contact',
                },
                data: {
                    type: 'TRUSTED_CONTACT_REQUEST',
                    contact_id: 'c1',
					sent_by: 'John Doe',
                }
            });

        });

        it('throws COULD_NOT_SEND_NOTIFICATION when firebase send fails', async () =>{
            const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            mockSendEachForMulticast.mockRejectedValueOnce(new Error('firebase failed'));

            await expect(
                notification_services.send_trusted_contact_request_notification(
                    ['token-1'],
                    'John Doe',
                    'c1'
                )
            ).rejects.toMatchObject({ errorCode: 'COULD_NOT_SEND_NOTIFICATION' });

            expect(errorSpy).toHaveBeenCalled();
            errorSpy.mockRestore();

        });
    });

    describe('send_trip_shared_notification', () => {
        it('sends trip shared notification', async () => {
            mockSendEachForMulticast.mockResolvedValue(undefined);

            await notification_services.send_trip_shared_notification(
                ['token-1'],
                'John Doe',
                't1'
            );

            expect(mockSendEachForMulticast).toHaveBeenCalledWith({
                fids: ['token-1'],
                notification: {
                    title: 'Trip Shared With You',
                    body: 'John Doe is sharing their live trip with you',
                },
                data: {
                    type: 'SHARED_TRIP',
                    trip_id: 't1',
                    shared_by: 'John Doe',
                }
            });

        });


        it('throws COULD_NOT_SEND_NOTIFICATION when firebase send fails', async () =>{
            const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            mockSendEachForMulticast.mockRejectedValueOnce(new Error('firebase failed'));

            await expect(
                notification_services.send_trip_shared_notification(
                    ['token-1'],
                    'John Doe',
                    't1'
                )
            ).rejects.toMatchObject({ errorCode: 'COULD_NOT_SEND_NOTIFICATION' });

            expect(errorSpy).toHaveBeenCalled();
            errorSpy.mockRestore();

        });
    });
    describe("send_trip_shared_revoked_notification", ()=>{
        it('sends trip revoked notification', async ()=>{
            mockSendEachForMulticast.mockResolvedValue(undefined);
            await notification_services.send_trip_revoked_notification(
                ['token-1'],
                'John Doe',
                't1'
            );
            expect(mockSendEachForMulticast).toHaveBeenCalledWith({
                tokens:['token-1'],
                notification:{
                    title: 'Trip access revoked',
                    body: 'John Doe is no longer sharing their live trip location with you ',
                },
                data:{
                    type: 'TRIP_REVOKED',
                    trip_id: 't1',
                    shared_by:'John Doe'
                }
            });
        });
        it('does not call sendEachForMUlticast when no tokens are provided', async()=>{
            await notification_services.send_trip_revoked_notification([], 'John Doe','t1');
            expect(mockSendEachForMulticast).not.toHaveBeenCalled();
        });
        it('does not throw and logs the error when firebase send fails',async ()=>{
            const errorSpy = jest.spyOn(console,'error').mockImplementation(() => {});
            mockSendEachForMulticast.mockRejectedValueOnce(new Error('firebase failed'));

            await expect(
                notification_services.send_trip_revoked_notification(['token-1'], 'John Doe', 't1')
            ).resolves.toBeUndefined();

            expect(errorSpy).toHaveBeenCalledWith(
                'Failed to send trip revoked notification: ','firebase failed'
            );
            errorSpy.mockRestore();
        });
    });

    describe('send_trip_alert_notification', () => {
        it('sends trip alert notification', async () => {
            mockSendEachForMulticast.mockResolvedValue(undefined);

            await notification_services.send_trip_alert_notification(
                ['token-1'],
                't1',
                'HARSH_BRAKE',
                'Harsh brake detected'
            );

            expect(mockSendEachForMulticast).toHaveBeenCalledWith({
                fids: ['token-1'],
                notification: {
                    title: 'HARSH_BRAKE',
                    body: 'Harsh brake detected',
                },
                data: {
                    type: 'TRIP_ALERT',
                    alert_type: 'HARSH_BRAKE',
                    trip_id: 't1',
                }
            });

        });

        it('throws COULD_NOT_SEND_NOTIFICATION when firebase send fails', async () =>{
            const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            mockSendEachForMulticast.mockRejectedValueOnce(new Error('firebase failed'));

            await expect(
                notification_services.send_trip_alert_notification(
                    ['token-1'],
                    't1',
                    'HARSH_BRAKE',
                    'Harsh brake detected'
                )
            ).rejects.toMatchObject({ errorCode: 'COULD_NOT_SEND_NOTIFICATION' });

            expect(errorSpy).toHaveBeenCalled();
            errorSpy.mockRestore();

        });

    });

    describe('send_general_notification', () => {
        it('sends general notification', async () => {
            mockSendEachForMulticast.mockResolvedValue(undefined);

            await notification_services.send_general_notification(
                ['token-1'],
                'General Update',
                'Message Body'
            );

            expect(mockSendEachForMulticast).toHaveBeenCalledWith({
                fids: ['token-1'],
                notification: {
                    title: 'General Update',
                    body: 'Message Body',
                },
                data: {
                    type: 'GENERAL'
                }
            });

        });

        it('throws COULD_NOT_SEND_NOTIFICATION when firebase send fails', async () =>{
            const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            mockSendEachForMulticast.mockRejectedValueOnce(new Error('firebase failed'));

            await expect(
                notification_services.send_general_notification(
                    ['token-1'],
                    'General Update',
                    'Message Body'
                )
            ).rejects.toMatchObject({ errorCode: 'COULD_NOT_SEND_NOTIFICATION' });

            expect(errorSpy).toHaveBeenCalled();
            errorSpy.mockRestore();

        });
    });

    describe('send_badge_notification', () => {
        it('sends badge notification', async () => {
            mockSendEachForMulticast.mockResolvedValue(undefined);

            await notification_services.send_badge_notification(
                ['token-1'],
                'Badge Unlocked',
                'You earned a new badge',
                'b1',
                'icon.png'
            );

            expect(mockSendEachForMulticast).toHaveBeenCalledWith({
                fids: ['token-1'],
                notification: {
                    title: 'Badge Unlocked',
                    body: 'You earned a new badge',
                },
                data: {
                    type: 'GAMIFICATION',
                    icon_url: 'icon.png',
                    badge_id: 'b1'
                }
            });

        });

        it('sends badge notification with missing title', async () => {
            mockSendEachForMulticast.mockResolvedValue(undefined);

            await notification_services.send_badge_notification(
                ['token-1'],
                '',
                'You earned a new badge',
                'b1',
                'icon.png'
            );

            expect(mockSendEachForMulticast).toHaveBeenCalledWith({
                fids: ['token-1'],
                notification: {
                    title: 'New Badge Unlocked',
                    body: 'You earned a new badge',
                },
                data: {
                    type: 'GAMIFICATION',
                    icon_url: 'icon.png',
                    badge_id: 'b1'
                }
            });

        });

        it('throws COULD_NOT_SEND_NOTIFICATION when firebase send fails', async () =>{
            const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            mockSendEachForMulticast.mockRejectedValueOnce(new Error('firebase failed'));

            await expect(
                notification_services.send_badge_notification(
                    ['token-1'],
                    'Badge Unlocked',
                    'You earned a new badge',
                    'b1',
                    'icon.png'
                )
            ).rejects.toMatchObject({ errorCode: 'COULD_NOT_SEND_NOTIFICATION' });

            expect(errorSpy).toHaveBeenCalled();
            errorSpy.mockRestore();

        });
    });

	describe('send_trusted_contact_response_notification', () => {
		it('sends the trusted contact response notification (APPROVED)', async () => {
			mockSendEachForMulticast.mockResolvedValue(undefined);

			await notification_services.send_trusted_contact_response_notification(
				['token-1'],
				'John Doe',
				'APPROVED' as any
			);

			expect(mockSendEachForMulticast).toHaveBeenCalledWith(expect.objectContaining({
				notification: {
					title: 'Trusted Contact',
					body: 'John Doe has accepted your Trusted Contact Request',
				}
			}));
		});

		it('throws COULD_NOT_SEND_NOTIFICATION when firebase fails', async () => {
			jest.spyOn(console, 'error').mockImplementation(() => {});
			mockSendEachForMulticast.mockRejectedValueOnce(new Error('Firebase error'));

			await expect(
				notification_services.send_trusted_contact_response_notification(['t1'], 'User', 'APPROVED' as any)
			).rejects.toMatchObject({errorCode: 'COULD_NOT_SEND_NOTIFICATION'});
		});
	});

    describe('fetch user notifications',()=>{
        
        it('returns list of user notifications', async () => {
            mock_prisma.notifications.findMany.mockResolvedValue([
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
            ]);
    
            const result = await notification_services.fetch_notifications('u1');
    
            expect(result.length).toBe(2);
            expect(result[0].notification_id).toBe('noti-1');
            expect(result[0].reference_id).toBe('contact-1');
            expect(result[1].notification_id).toBe('noti-2');
            expect(result[1].reference_id).toBe('contact-2');
        });
    });

    describe('send_unexpected_stop_notification', () => {
        it('sends unexpected stop notification', async () => {
            mockSendEachForMulticast.mockResolvedValue(undefined);

            await notification_services.send_unexpected_stop_notification(
                ['token-1'],
                't1',
                'event-1',
                'Unexpected stop occurred'
            );

            expect(mockSendEachForMulticast).toHaveBeenCalledWith({
                fids: ['token-1'],
                notification: {
                    title: 'Unexpected Stop',
                    body: 'Unexpected stop occurred',
                },
                data: {
                    type: 'UNEXPECTED_STOP',
                    event_id: 'event-1',
                    trip_id: 't1',
                }
            });

        });

        it('throws COULD_NOT_SEND_NOTIFICATION when firebase send fails', async () =>{
            const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            mockSendEachForMulticast.mockRejectedValueOnce(new Error('firebase failed'));

            await expect(
                notification_services.send_unexpected_stop_notification(
                    ['token-1'],
                    't1',
                    'event-1',
                    'Unexpected stop occurred'
                )
            ).rejects.toMatchObject({ errorCode: 'COULD_NOT_SEND_NOTIFICATION' });

            expect(errorSpy).toHaveBeenCalled();
            errorSpy.mockRestore();

        });

    });

    describe('delete user notifications',()=>{
        
        it('returns deleted count on success', async () => {

            const deleteManyMock = jest.fn<() => Promise<{count: number}>>().mockResolvedValue({ count: 2 });
            
            (mock_prisma.$transaction as jest.Mock).mockImplementation(async (callback: any) =>{
                return callback({
                    notifications: {
                        deleteMany: deleteManyMock,
                    }
                });
            });
    
            const result = await notification_services.delete_notifications('u1');
    
            expect(result).toBe(2);
        });
    });
});


