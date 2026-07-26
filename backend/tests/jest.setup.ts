import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });
import { jest } from '@jest/globals';

process.env.NODE_ENV = process.env.NODE_ENV || 'test';

//mock firebase delivery - third party
jest.mock('../src/services/notification_service', () => {

	const actual = jest.requireActual('../src/services/notification_service') as any;

	return {
		notification_services: {
			...actual.notification_services,
			send_trusted_contact_request_notification: jest.fn<any>().mockResolvedValue(undefined),
			send_trusted_contact_response_notification: jest.fn<any>().mockResolvedValue(undefined),
			send_trip_shared_notification: jest.fn<any>().mockResolvedValue(undefined),
			send_trip_alert_notification: jest.fn<any>().mockResolvedValue(undefined),
			send_general_notification: jest.fn<any>().mockResolvedValue(undefined),
			send_badge_notification: jest.fn<any>().mockResolvedValue(undefined),
			//fetch_notifications: jest.fn<any>().mockResolvedValue([]),
		},
	};
});