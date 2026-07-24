import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });
import { jest } from '@jest/globals';

process.env.NODE_ENV = process.env.NODE_ENV || 'test';

//mock firebase delivery - third party
jest.mock('../src/services/notification_service', () => ({
	notification_services: {
		send_trusted_contact_request_notification: jest.fn<any>().mockResolvedValue(undefined),
		send_trusted_contact_response_notification: jest.fn<any>().mockResolvedValue(undefined),
		send_trip_shared_notification: jest.fn<any>().mockResolvedValue(undefined),
		send_trip_alert_notification: jest.fn<any>().mockResolvedValue(undefined),
		send_general_notification: jest.fn<any>().mockResolvedValue(undefined),
		send_badge_notification: jest.fn<any>().mockResolvedValue(undefined),
	},
}));