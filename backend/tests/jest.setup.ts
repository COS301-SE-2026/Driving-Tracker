import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });
import { jest } from '@jest/globals';

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.AZURE_STORAGE_CONNECTION_STRING = "UseDevelopmentStorage=true";
process.env.AZURE_STORAGE_PROFILE_CONTAINER_NAME = "test-profile-container";
process.env.AZURE_STORAGE_VEHICLE_CONTAINER_NAME = "test-vehicle-container";

const asyncNoop = async () => undefined;

//mock firebase delivery - third party
jest.mock('../src/services/notification_service', () => {

	const actual = jest.requireActual('../src/services/notification_service') as any;

	return {
		notification_services: {
			...actual.notification_services,
			send_trusted_contact_request_notification: jest.fn(asyncNoop),
			send_trusted_contact_response_notification: jest.fn(asyncNoop),
			send_trip_shared_notification: jest.fn(asyncNoop),
			send_trip_alert_notification: jest.fn(asyncNoop),
			send_general_notification: jest.fn(asyncNoop),
			send_badge_notification: jest.fn(asyncNoop),
			//fetch_notifications: jest.fn<any>().mockResolvedValue([]),
		},
	};
});