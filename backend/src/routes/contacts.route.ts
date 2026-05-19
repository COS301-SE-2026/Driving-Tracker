import {Router} from "express";
import contacts_controller from "../controllers/contacts.controller";
import {verify_token} from '../middleware/auth';

const contacts_router = Router();
/**
 * routes are relative to the prefix this router is mounted at
 * E.g. if index.ts does app.use("/contacts", contacts_router),
 * then contacts_router/post("/") === POST /contacts
 */

//add trusted contact for logged-in user
contacts_router.post("/", verify_token, contacts_controller.create_contact);
//lists all trusted contacts for logged in user
contacts_router.get("/", verify_token, contacts_controller.get_contacts);
//creates alert for event and notifies selected contacts
contacts_router.post("/alerts", verify_token, contacts_controller.alert_contacts);
//persists location sharing for a trip until end
contacts_router.post("/share_location", verify_token, contacts_controller.share_location);

export default contacts_router;