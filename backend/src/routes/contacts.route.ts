import {Router, request, response } from "express";
import contacts_controller from "../controllers/contacts.controller";
import {verify_token} from '../middleware/auth';

const contacts_router = Router();
//the way the route is called in the front end for example rout.__(what ever it is post,patch...)("/trips/...", ...)look at mp for reference
//will structure in crud operations 

//Create 

//read basically get 

//delete 

//Update 

export default contacts_router;