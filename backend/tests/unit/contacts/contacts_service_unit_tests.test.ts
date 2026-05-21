jest.mock('../../../src/db/prisma', () => ({
    __esModule: true,
    default: {
        users: {
        findFirst: jest.fn(),
        },
        trusted_contacts: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
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

import {describe, it, expect, jest, beforeEach} from '@jest/globals';
import prisma from '../../../src/db/prisma';
import { contact_services } from '../../../src/services/contacts_services';

const mock_prisma = prisma as any ;

describe('Contact services . create_trusted_contact',()=>{
    beforeEach(async()=>{jest.clearAllMocks});

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

        const result = await contact_services.create_trusted_contact('u1', 'johndoe');

        expect(result.contact_id).toBe('c1');
        expect(result.username).toBe('johndoe');
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
    beforeEach(async()=>{jest.clearAllMocks});

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
});

describe('alert contacts for event',()=>{
    beforeEach(async()=>{jest.clearAllMocks});

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
    beforeEach(async()=>{jest.clearAllMocks});

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
            },
        ]);
        mock_prisma.trip_location_shares.createMany.mockResolvedValue({
            count: 1,
        });

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
})