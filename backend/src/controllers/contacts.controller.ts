import {Request, Response} from "express";
import {contact_services} from  "../services/contacts_services";

/**
 * authenticated user id stored at res.locals.user_id inside verify_token middleware
 * request-scoped storage in Express 
 */
function get_user_id(res: Response): string | null {
    const user_id = res.locals.user_id as string | undefined;
    return user_id ?? null;
}

const contacts_controller = {
    /**POST /contacts
    *Body: identifer is username or user_id
    */
    async create_contact(req: Request, res: Response) {
        const user_id = get_user_id(res);
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

            return res.status(500).json({
                error: "INTERNAL_SERVER_ERROR"
            });
        }
    },


    /**
   * GET /contacts
   * Response: list of contacts for logged-in user
   */
    
};
export default contacts_controller;