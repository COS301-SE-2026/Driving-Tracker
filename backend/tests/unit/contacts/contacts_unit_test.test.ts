jest.mock('../../../src/services/contacts_services');

import { describe, it, expect, jest,beforeEach } from '@jest/globals';
import contacts_controller from '../../../src/controllers/contacts.controller';
const { create_contact, get_contacts, alert_contacts, share_location, respond_to_contact_request, get_receieved_contact_requests } = contacts_controller;
import { contact_services } from '../../../src/services/contacts_services';

// jest.mock('../../../src/middleware/auth',()=>({}));//the auth

describe('Contact endpoints', ()=>{
    beforeEach(async()=> jest.clearAllMocks());

    //helper for req/ res
    const make_res = () =>{
        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json});
        return{status, json};
    };
    describe('create trust contacted',()=>{
        it('returns 201 on success', async ()=>{
            const spy = jest.spyOn(contact_services,'create_trusted_contact').mockResolvedValueOnce({
                contact_id: 'contact-1',
                username: 'friend-1',
            });
            const req: any ={
                user:{
                    sub:'user-1'
                },
                body:{
                    identifier:'friend-1'
                }
            };
            const res : any = make_res();
            await create_contact(req, res);
            expect(spy).toHaveBeenCalledWith('user-1', 'friend-1');
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { contact_id: 'contact-1',username:'friend-1' } }));
        });

        it('returns 401 when unauthenticated user try to add a contact', async() =>{
            const req: any = { user: undefined, body: {} };
            const res: any = make_res();
            await create_contact(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
        });
        it('Return 400 for invalid for body request',async()=>{
            const req: any = { user: { sub: 'user-1' }, body: { identifier: 123 } };
            const res: any = make_res();
            await create_contact(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error:"CANNOT_ADD_USER"}));
        });
        it('maps service errors to HTTP codes', async () => {
            jest.spyOn(contact_services, 'create_trusted_contact').mockRejectedValueOnce({ code: 'ALREADY_TRUSTED_CONTACT' });
            const req: any = { user: { sub: 'user-1' }, body: { identifier: 'friend' } };
            const res: any = make_res();
            await create_contact(req, res);
            expect(res.status).toHaveBeenCalledWith(409);

            jest.spyOn(contact_services, 'create_trusted_contact').mockRejectedValueOnce({ code: 'USER_NOT_FOUND' });
            await create_contact(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });
    });
    //test for the list_trusted_contacts
    describe('get_contacts endpoint',()=>{
        it('returns 200 and the contacts assigned to the user',async()=>{
            const contacts = [{ contact_id:'c1', username:'a', name: 'Alice', email: null }];
            jest.spyOn(contact_services,'list_trusted_contacts').mockResolvedValueOnce(contacts as any);
            const req: any = { user: { sub: 'user-1' } };
            const res: any = make_res();
            await get_contacts(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { contacts } }));
        });

        it('returns 401 when unauthenticated', async () => {
            const req: any = { user: undefined };
            const res: any = make_res();
            await get_contacts(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
        });
        it('handles service permission error', async () => {
            jest.spyOn(contact_services, 'list_trusted_contacts').mockRejectedValueOnce({ code: 'CANNOT_ACCESS_CONTACTS' });
            const req: any = { user: { sub: 'user-1' } };
            const res: any = make_res();
            await get_contacts(req, res);
            expect(res.status).toHaveBeenCalledWith(403);
        }); 
    });
    //The alert contacts endpoint
    describe('Alert_contacts',()=>{
        it('Returns  200 when it successfully alerts the users contact', async () =>{
            jest.spyOn(contact_services,'alert_contacts_for_event').mockResolvedValueOnce(undefined);
            const req: any = { 
                user:{sub:'tester-1' },
                body:{event_type: 'accident', event_id: 'e1', contacts: [{ contact_id: 'c1' }]}
            }
            const res: any = make_res();
            await alert_contacts(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({message:'Contacts successfully alerted'}));
        });

        it('Returns 400 when user is unauthenticated', async ()=>{
            const req: any = {user : undefined, body:{}};
            const res: any = make_res();
            await alert_contacts(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
        });
        it('returns 400 for bad body', async () => {
            const req: any = { user: { sub: 'user-1' }, body: { event_type: 1 } };
            const res: any = make_res();
            await alert_contacts(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
        it('Returns 404 for NOT_FOUND errors', async () => {
            jest.spyOn(contact_services, 'alert_contacts_for_event').mockRejectedValueOnce({ code: 'CONTACT_NOT_FOUND' });
            const req: any = { user: { sub: 'user-1' }, body: { event_type: 'x', event_id: 'e', contacts: [{ contact_id: 'c' }] } };
            const res: any = make_res();
            await alert_contacts(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });
    }); 

    describe('share_location', () => {
        it('returns 401 when unauthenticated', async () => {
            const req: any = { user: undefined, body: {} };
            const res: any = make_res();
            await share_location(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('returns 400 when no contacts provided', async () => {
            const req: any = { user: { sub: 'user-1' }, body: { trip_id: 't1', contacts: [] } };
            const res: any = make_res();
            await share_location(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('returns 404 when trip not found', async () => {
            jest.spyOn(contact_services, 'share_trip_location').mockRejectedValueOnce({ code: 'TRIP_NOT_FOUND' });
            const req: any = { user: { sub: 'user-1' }, body: { trip_id: 't1', contacts: [{ contact_id: 'c1' }] } };
            const res: any = make_res();
            await share_location(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('returns 201 on success', async () => {
            jest.spyOn(contact_services, 'share_trip_location').mockResolvedValueOnce({
                trip_id: 't1',
                shared_with: [{contact_id:'c1',username:'friend-1'}],
                shared_at: '2026-01-01T00:00:00Z',
            });
            const req: any = { user: { sub: 'user-1' }, body: { trip_id: 't1', contacts: [{ contact_id: 'c1' }] } };
            const res: any = make_res();
            await share_location(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Location successfully shared' }));
    	});

		it('returns 403 when contact is not trusted', async () =>{
			jest.spyOn(contact_services, 'share_trip_location').mockRejectedValueOnce({
                code: 'NOT_TRUSTED_CONTACT'
            });
            const req: any = { user: { sub: 'user-1' }, body: { trip_id: 't1', contacts: [{ contact_id: 'c1' }] } };
            const res: any = make_res();
            await share_location(req, res);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'NOT_TRUSTED_CONTACT', message: 'Cannot share location with non-trusted contacts' }));
		});

		it('returns 409 when user not found during share', async () =>{
			jest.spyOn(contact_services, 'share_trip_location').mockRejectedValueOnce({
                code: 'USER_NOT_FOUND'
            });
            const req: any = { user: { sub: 'user-1' }, body: { trip_id: 't1', contacts: [{ contact_id: 'c1' }] } };
            const res: any = make_res();
            await share_location(req, res);
            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'USER_NOT_FOUND', message: 'Could not find user' }));
		});

  	});

  	describe('respond_to_contact_request',()=>{
        it('returns 200 on success', async()=>{
            jest.spyOn(contact_services,'respond_to_contact_request').mockResolvedValueOnce({
                contact_id: 'c1',
                message: 'Status updated successfully'
            } as any);

            const req: any = { 
                user: { sub: 'user-1' },
                params: {contact_id:  'c1'},
                body: { status: 'APPROVED' } 
            };
            const res: any = make_res();

            await respond_to_contact_request(req, res);

            expect(contact_services.respond_to_contact_request).toHaveBeenCalledWith('APPROVED', 'c1', 'user-1');

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Status updated successfully', data: { contact_id: 'c1' } }));
        });

        it('returns 409 when unauthenticated', async () => {
            const req: any = { user: undefined, params: {contact_id:  'c1'}, body: { status: 'APPROVED' }};
            const res: any = make_res();

            await respond_to_contact_request(req, res);
            expect(res.status).toHaveBeenCalledWith(409);
        });

        it('returns 422 for invalid status', async () => {
            const req: any = { user: { sub: 'user-1' }, params: {contact_id:  'c1'}, body: { status: 'PENDING' }};
            const res: any = make_res();

            await respond_to_contact_request(req, res);
            expect(res.status).toHaveBeenCalledWith(422);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ error: 'INVALID_STATUS' })
            );
        }); 

        it('maps CONTACT_REQUEST_NOT_FOUND from service', async () => {
           jest.spyOn(contact_services, 'respond_to_contact_request').mockRejectedValueOnce({
            code:  'CONTACT_REQUEST_NOT_FOUND'
           });

            const req: any = { user: { sub: 'user-1' }, params: {contact_id:  'c1'}, body: { status: 'APPROVED' }};
            const res: any = make_res();

            await respond_to_contact_request(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        }); 
    });

    describe('get received contacts requests endpoint',()=>{
        it('returns 200 and trusted contact requests sent to user',async()=>{
            const requests = [{ contact_id:'c1', created_at: '2026-07-07', username:'a'}];
            jest.spyOn(contact_services,'get_received_contact_requests').mockResolvedValueOnce(requests as any);
            const req: any = { user: { sub: 'user-1' } };
            const res: any = make_res();
            await get_receieved_contact_requests(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { requests }, message: "Fetched received contact requests" }));
        });

        it('returns 401 when unauthenticated', async () => {
            const req: any = { user: undefined };
            const res: any = make_res();
            await get_receieved_contact_requests(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
        });
        it('handles other error', async () => {
            jest.spyOn(contact_services, 'get_received_contact_requests').mockRejectedValueOnce({ code: 'CANNOT_ACCESS_REQUESTS' });
            const req: any = { user: { sub: 'user-1' } };
            const res: any = make_res();
            await get_receieved_contact_requests(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        }); 
    });



})