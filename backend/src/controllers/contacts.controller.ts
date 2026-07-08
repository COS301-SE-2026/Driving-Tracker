import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { contact_services } from "../services/contacts_services";
import { ExtendedError } from "../utils/errors";


function get_user_id(req: AuthRequest): string | null {
  return req.user?.sub ?? null;
}

const contacts_controller = {
    /**POST /contacts
    *Body: identifer is username or user_id
    */
    async create_contact(req: AuthRequest, res: Response) {
        const user_id = get_user_id(req);
        if(!user_id){
            return res.status(401).json({ error: "UNAUTHORIZED"});
        }
        //pull identifer from request body
        const {identifier } = req.body ?? {};

        //body validation
        if(!identifier || typeof identifier !== "string"){
            return res.status(400).json({
                error: "CANNOT_ADD_USER",
                message: "Cannot add this user as a contact",
            });
        }

        try{
            //delegate to service:
            const result = await contact_services.create_trusted_contact(user_id, identifier);
            return res.status(201).json({
                data: {
                    contact_id: result.contact_id,
                    username: result.username,
                },
            });
        }catch(e: any){
            //map service error codes to API responses
            if((e instanceof ExtendedError)){
                
                return res.status(500).json({
                    error: e.errorCode,
                    message: e.message,
                });
            }

            if(e?.code === "ALREADY_TRUSTED_CONTACT"){
                return res.status(409).json({
                    error: "ALREADY_TRUSTED_CONTACT",
                    message: "contact already added",
                });
            }
            if(e?.code === "CANNOT_ADD_USER"){
                return res.status(400).json({
                    error: "CANNOT_ADD_USER",
                    message: "Cannot add this user as a contact",
                });
            }
            if(e?.code === "USER_NOT_FOUND"){
                return res.status(404).json({
                    error: "USER_NOT_FOUND",
                    message: "User not found",
                });
            }

            return res.status(500).json({
                error: "INTERNAL_SERVER_ERROR"
            });
        }
    },


    /**
   * GET /contacts
   * Response: list of contacts for logged-in user
   */
    async get_contacts(req: AuthRequest, res: Response){
        const user_id = get_user_id(req);
        if(!user_id){
            return res.status(401).json({
                error: "UNAUTHORIZED"
            });
        }

        try{
            //delegate to service
            const contacts = await contact_services.list_trusted_contacts(user_id);

            return res.status(200).json({
                data: { contacts },
                message: "Contacts successfully retrieved",
            });
        }catch(e: any){
            if(e?.code === "CANNOT_ACCESS_CONTACTS"){
                return res.status(403).json({
                    error: "CANNOT_ACCESS_CONTACTS",
                    message: "Cannot access these contacts",
                });
            }
            return res.status(500).json({
                error: "INTERNAL_SERVER_ERROR"
            });
        }
    },


    /**
   * POST /contacts/alerts
   * Body: {
   *   event_type: string,
   *   event_id: uuid,
   *   message?: string,
   *   contacts: [{ contact_id: uuid }]
   * }
   */
    async alert_contacts(req: AuthRequest, res: Response){
        const user_id = get_user_id(req);
        if(!user_id){
            return res.status(401).json({
                error: "UNAUTHORIZED"
            });
        }

        const { event_type, event_id, message, contacts } = req.body ?? {};

        if((!event_type || typeof event_type !== "string" || !event_id || typeof event_id !== "string")){
            return res.status(400).json({
                error: "BAD_REQUEST",
                message: "Invalid request body",
            });
        }

        //extract contact ids from array of objects
        const contact_ids = 
        Array.isArray(contacts)? contacts.map((c) => c?.contact_id).filter(Boolean) : [];

        try{
            await contact_services.alert_contacts_for_event({
                user_id,
                event_type,
                event_id,
                message: typeof message === "string" ? message : null,
                contact_ids,
            });
            return res.status(200).json({
                message: "Contacts successfully alerted"
            });
        }catch(e: any){
            if (e?.code === "CANNOT_ACCESS_CONTACTS") {
                return res.status(403).json({
                error: "CANNOT_ACCESS_CONTACTS",
                message: "Cannot access these contacts",
                });
            }

            if (e?.code === "CONTACT_NOT_FOUND") {
                return res.status(404).json({
                error: "CONTACT_NOT_FOUND",
                message: "Cannot find contact",
                });
            }

            if (e?.code === "EVENT_NOT_FOUND") {
                return res.status(404).json({
                error: "EVENT_NOT_FOUND",
                message: "Cannot find event",
                });
            }     
            
            return res.status(500).json({
                error: "INTERNAL_SERVER_ERROR"
            });
        }
    },


    /**
     * POST /contacts/share_location
     * intentional: support both possible shapes (although API contract specifies contacts object)
     * {
        *   "trip_id": "...uuid...",
        *   "contacts": [{ "contact_id": "...uuid..." }]
        * }
    
    * {
        *   "contacts": {
        *     "trip_id": "...uuid...",
        *     "contacts": [{ "contact_id": "...uuid..." }]
        *   }
        * }
     */

    async share_location(req: AuthRequest, res: Response){
        const user_id = get_user_id(req);
        if(!user_id){
            return res.status(401).json({
                error: "UNAUTHORIZED"
            });
        }
        const body = req.body ?? {};

        // if body.contacts is an object wrapper, use it, else use body directly
        const wrapper = body.contacts && typeof body.contacts === "object" && !Array.isArray(body.contacts) ? body.contacts : body;
        const trip_id = wrapper.trip_id;
        const contacts_arr = wrapper.contacts;

        const contact_ids = 
        Array.isArray(contacts_arr) ? contacts_arr.map((c) => c?.contact_id).filter(Boolean) : [];

        if(!contact_ids.length){
            return res.status(400).json({
                error: "NO_CONTACTS_PROVIDED",
                message: "Contact list is empty",
            });
        }

        if(!trip_id || typeof trip_id !== "string"){
            return res.status(404).json({
                error: "TRIP_NOT_FOUND",
                message: "Cannot find trip",
            });
        }

        //delegate to service
        try{
            const result = await contact_services.share_trip_location({
                user_id,
                trip_id,
                contact_ids,
            });

            return res.status(201).json({
                message: "Location successfully shared",
                data: {
                    trip_id: result.trip_id,
                    shared_with: result.shared_with,
                    shared_at: result.shared_at,
                },
            });
        }catch(e: any){
            if (e?.code === "TRIP_NOT_FOUND") {
                return res.status(404).json({
                error: "TRIP_NOT_FOUND",
                message: "Cannot find trip",
                });
            }

            if (e?.code === "NOT_TRUSTED_CONTACT") {
                return res.status(403).json({
                error: "NOT_TRUSTED_CONTACT",
                message: "Cannot share location with non-trusted contacts",
                });
            }

            return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" }); 
        }
    },
};
export default contacts_controller;