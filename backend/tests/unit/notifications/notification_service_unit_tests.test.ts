
jest.mock('../../../src/utils/firebase', () => ({
    getMessaging: jest.fn(),
}));

import {describe, it, expect, jest, beforeEach} from '@jest/globals';
import { getMessaging } from '../../../src/utils/firebase';
import { notification_services } from '../../../src/services/notification_service';

const mockGetMessaging = getMessaging as jest.Mock;
const mockSendEachForMulticast = jest.fn() as any;

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

        it('throws when no tokens are provided', async () => {
            await expect(
                notification_services.send_trusted_contact_request_notification([], 'John Doe', 'c1')
            ).rejects.toMatchObject({ errorCode: 'NO_TOKENS_PROVIDED' });
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

        it('throws when no tokens are provided', async () => {
            await expect(
                notification_services.send_trip_shared_notification([], 'John Doe', 'c1')
            ).rejects.toMatchObject({ errorCode: 'NO_TOKENS_PROVIDED' });
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

        it('throws when no tokens are provided', async () => {
            await expect(
                notification_services.send_trip_alert_notification([], 't1', 'HARSH_BRAKE', 'Harsh brake detected')
            ).rejects.toMatchObject({ errorCode: 'NO_TOKENS_PROVIDED' });
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

        it('throws when no tokens are provided', async () => {
            await expect(
                notification_services.send_general_notification([], 'General Update', 'Message Body')
            ).rejects.toMatchObject({ errorCode: 'NO_TOKENS_PROVIDED' });
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

        it('throws when no tokens are provided', async () => {
            await expect(
                notification_services.send_badge_notification([],'Badge Unlocked',
                'You earned a new badge','b1','icon.png')
            ).rejects.toMatchObject({ errorCode: 'NO_TOKENS_PROVIDED' });
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
});


