jest.mock('../../../src/services/contacts_services');

import { describe, it, expect, jest } from '@jest/globals';
import contacts_controller from '../../../src/controllers/contacts.controller';
const { create_contact, get_contacts, alert_contacts, share_location } = contacts_controller;
import { contact_services } from '../../../src/services/contacts_services';
import { beforeEach } from 'node:test';
// jest.mock('../../../src/middleware/auth',()=>({}));//the auth

describe('Contact endpoints', ()=>{
    beforeEach(()=> jest.clearAllMocks());

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
                username: 'friend',
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
            expect(spy).toHaveBeenCalledWith('user-1', 'friend');
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { contact_id: 'contact-1' } }));
        });

        it('returns 401 when unauthenticated user try to add a contact', async() =>{
            const req: any = { user: undefined, body: {} };
            const res: any = make_res();
            await create_contact(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
        });
    });
})