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
        },
        trip_events: {
        findUnique: jest.fn(),
        },
        trips: {
        findUnique: jest.fn(),
        },
        alerts: {
        create: jest.fn(),
        },
        alert_notifications: {
        createMany: jest.fn(),
        },
        trip_location_shares: {
        createMany: jest.fn(),
        },
        $transaction: jest.fn(),
    },
}));

jest.mock('../../../src/services/user_devices_services', () => ({
    user_devices_services: {
        get_user_fcm_tokens: jest.fn(),
        get_multiple_users_fcm_tokens: jest.fn(),
    },
}));

jest.mock('../../../src/services/notification_service', () => ({
    notification_services: {
        send_trusted_contact_request_notification: jest.fn(),
        send_trip_shared_notification: jest.fn(),
        send_trusted_contact_response_notification: jest.fn(),
    },
}));

import {describe, it, expect, jest, beforeEach} from '@jest/globals';
import prisma from '../../../src/db/prisma';
import { contact_services } from '../../../src/services/contacts_services';
import { user_devices_services } from '../../../src/services/user_devices_services';
import { notification_services } from '../../../src/services/notification_service';

const mock_prisma = prisma as any ;
const mock_user_devices_services = user_devices_services as any;
const mock_notification_services = notification_services as any;

describe('Contact services . create_trusted_contact',()=>{
    beforeEach(async()=>{jest.clearAllMocks() });

    it('creates when valid username provided', async()=>{
        mock_prisma.users.findFirst.mockResolvedValue({
            user_id:'u2',
            username:'johndoe',
            name:'john',
            surname:'Doe',
            email:'john@test.com',
        });
        mock_prisma.trusted_contacts.findFirst.mockResolvedValue(null);
        mock_prisma.trusted_contacts.create.mockResolvedValue({
            contact_id: 'c1',
        });
        mock_prisma.user_devices.findMany.mockResolvedValue([
            { fcm_token: 'token-1' },
        ]);
        mock_user_devices_services.get_user_fcm_tokens.mockResolvedValue([
            'token-1',
        ]);
        mock_notification_services.send_trusted_contact_request_notification.mockResolvedValue(undefined);

        const result = await contact_services.create_trusted_contact('u1', 'johndoe');

        expect(result.contact_id).toBe('c1');
        expect(result.username).toBe('johndoe');
        expect(mock_user_devices_services.get_user_fcm_tokens).toHaveBeenCalledWith('u2');
        expect(mock_notification_services.send_trusted_contact_request_notification).toHaveBeenCalled();
    });

    it('throws when user not found', async ()=>{
        mock_prisma.users.findFirst.mockResolvedValue(null);

        await expect(
            contact_services.create_trusted_contact('u1','unknown')
        ).rejects.toMatchObject({code: 'USER_NOT_FOUND'});
    });

    it('throws when trying to add yourself', async () => {
        mock_prisma.users.findFirst.mockResolvedValue({
            user_id: 'u1',
            username: 'sameperson',
            name: 'Same',
            surname: 'Person',
            email: 'same@example.com',
        });

        await expect(
            contact_services.create_trusted_contact('u1', 'sameperson')
        ).rejects.toMatchObject({ code: 'CANNOT_ADD_USER' });
    });
});

describe('contact services.list_trusted_contacts',()=>{
    beforeEach(async()=>{jest.clearAllMocks()});

    it('returns list of trusted contacts', async () => {
        mock_prisma.trusted_contacts.findMany.mockResolvedValue([
            {
                contact_id: 'c1',
                name: 'John Doe',
                email: 'john@example.com',
                consent_status: 'CONSENTED',
                contact_user: { username: 'johndoe' },
            },
            {
                contact_id: 'c2',
                name: 'Jane Smith',
                email: 'jane@example.com',
                consent_status: 'CONSENTED',
                contact_user: { username: 'janesmith' },
            },
        ]);

        const result = await contact_services.list_trusted_contacts('u1');

        expect(result.length).toBe(2);
        expect(result[0].contact_id).toBe('c1');
        expect(result[0].username).toBe('johndoe');
    });

    it('returns contact with profile picture paths', async () => {
        mock_prisma.trusted_contacts.findMany.mockResolvedValue([{
            contact_id: 'c1',
            contact_user_id: 'u2',
            contact_user: {
                username: 'johndoe',
                profile_picture_url: 'pic.jpg'
            },
        }]);
        const result = await contact_services.list_trusted_contacts('u1');

        expect(result[0].profile_picture_url).toBe('upload/profile-picture/u2');
    });
});

describe('alert contacts for event',()=>{
    beforeEach(async()=>{jest.clearAllMocks()});

    it('creates alerts and notifications ',async() =>{
        mock_prisma.trip_events.findUnique.mockResolvedValue({
            even_id: 'e1',
            trip_id: 't1'
        });
        mock_prisma.trips.findUnique.mockResolvedValue({
            trip_id:'t1',
            user_id:'u1'
        });
        mock_prisma.trusted_contacts.findMany.mockResolvedValue([
            { contact_id: 'c1' },
            { contact_id: 'c2' },
        ]);

        
        await contact_services.alert_contacts_for_event({
            user_id: 'u1',
            event_type: 'HARSH_BRAKE',
            event_id: 'e1',
            message: 'Harsh brake detected',
            contact_ids: ['c1', 'c2'],
        });

        expect(mock_prisma.trip_events.findUnique).toHaveBeenCalled();
    });
});
describe('share trip location',()=>{
    beforeEach(async()=>{ jest.clearAllMocks() });

    it('shares trip location with contacts', async () => {
        mock_prisma.trips.findUnique.mockResolvedValue({
            trip_id: 't1',
            user_id: 'u1',
            end_time: null,
        });
        mock_prisma.trusted_contacts.findMany.mockResolvedValue([
            {
                contact_id: 'c1',
                contact_user: { username: 'contact1' },
                contact_user_id: 'u2'
            },
        ]);
        mock_prisma.trip_location_shares.createMany.mockResolvedValue({
            count: 1,
        });

        mock_user_devices_services.get_multiple_users_fcm_tokens.mockResolvedValue([
            'token-1'
        ]);

        mock_notification_services.send_trip_shared_notification.mockResolvedValue(undefined);

        const result = await contact_services.share_trip_location({
            user_id: 'u1',
            trip_id: 't1',
            contact_ids: ['c1'],
        });

        expect(result.trip_id).toBe('t1');
        expect(result.shared_with.length).toBe(1);
        expect(result.shared_with[0].username).toBe('contact1');
    });

    it('throws when trip not found', async () => {
        mock_prisma.trips.findUnique.mockResolvedValue(null);

        await expect(
        contact_services.share_trip_location({
            user_id: 'u1',
            trip_id: 't1',
            contact_ids: ['c1'],
        })
        ).rejects.toMatchObject({ code: 'TRIP_NOT_FOUND' });
    });
});

describe('contact services.respond_to_contact_request', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('updates status and sends response notification', async () => {
        mock_prisma.trusted_contacts.findFirst.mockResolvedValue({
            contact_id: 'c1',
            user_id: 'owner-1',
            contact_user_id: 'responder-1'
        });

        mock_prisma.trusted_contacts.update.mockResolvedValue({
            contact_id: 'c1',
            consent_status: 'APPROVED',
        });
        mock_user_devices_services.get_user_fcm_tokens.mockResolvedValue(['token-1']);
        mock_prisma.users.findFirst.mockResolvedValue({
            user_id: 'responder-1',
            username: 'janeD',
            name: 'Jane',
            surname: 'Doe',
        });
        mock_notification_services.send_trusted_contact_response_notification.mockResolvedValue(undefined);

        const result = await contact_services.respond_to_contact_request(
            'APPROVED',
            'c1',
            'responder-1'
        );

        expect(result).toEqual({
            contact_id: 'c1',
            message: 'Status updated successfully',
        });

        expect(mock_prisma.trusted_contacts.update).toHaveBeenCalledWith({
            data: { consent_status: 'APPROVED' },
            where:  { contact_id: 'c1' } 
        });

        expect(mock_user_devices_services.get_user_fcm_tokens).toHaveBeenCalledWith('owner-1');
        expect(mock_notification_services.send_trusted_contact_response_notification).toHaveBeenCalledWith(
            ['token-1'],
            'Jane Doe',
            'APPROVED'
        );

    });

    it('throws when status is invalid', async() => {
        await expect(
            contact_services.respond_to_contact_request('DESTROYED', 'c1', 'responder-1')
        ).rejects.toMatchObject({ code: 'INVALID_STATUS' });
    });

    it('throws when contact reqquest is not found', async() => {
        mock_prisma.trusted_contacts.findFirst.mockResolvedValue(null);

        await expect(
            contact_services.respond_to_contact_request('APPROVED', 'c1', 'responder-1')
        ).rejects.toMatchObject({ code: 'CONTACT_REQUEST_NOT_FOUND' });
    });

    it('throws when sender full name cannot be found', async() => {
        mock_prisma.trusted_contacts.findFirst.mockResolvedValue({
            contact_id: 'c1',
            user_id: 'owner-1',
            contact_user_id: 'responder-1'
        });

        mock_prisma.trusted_contacts.update.mockResolvedValue({contact_id: 'c1'});
        mock_user_devices_services.get_user_fcm_tokens.mockResolvedValue(['token-1']);
        mock_prisma.users.findFirst.mockResolvedValue(null);

        await expect(
            contact_services.respond_to_contact_request('APPROVED', 'c1', 'responder-1')
        ).rejects.toMatchObject({ code: 'USER_NOT_FOUND' });
    });

});

describe('contact services.get_received_contact_requests',()=>{
    beforeEach(async()=>{jest.clearAllMocks()});

    it('returns list of trusted contacts', async () => {
        mock_prisma.trusted_contacts.findMany.mockResolvedValue([
            {
                contact_id: 'c1',
                user_id: 'user-1',
                created_at: '2026-03-03',
                owner_user: { username: 'johndoe' },
            },
            {
                contact_id: 'c2',
                user_id: 'user-2',
                created_at: '2026-04-04',
                owner_user: { username: 'janesmith' },
            },
        ]);

        const result = await contact_services.get_received_contact_requests('u1');

        expect(result.length).toBe(2);
        expect(result[0].contact_id).toBe('c1');
        expect(result[0].username).toBe('johndoe');
        expect(result[1].contact_id).toBe('c2');
        expect(result[1].username).toBe('janesmith');
    });

    it('returns empty list when no notifications', async () => {
        mock_prisma.trusted_contacts.findMany.mockResolvedValue([]);

        const result = await contact_services.get_received_contact_requests('u1');

        expect(result.length).toBe(0);
        
    });
});