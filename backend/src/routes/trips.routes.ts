import {Router, request, response } from "express";
import * as trips_controller from "../controllers/trips.controller";
import {verify_token} from '../middleware/auth';

const trips_router = Router();
//the way the route is called in the front end for example rout.__(what ever it is post,patch...)("/trips/...", ...)look at mp for reference
//will structure in crud operations 

//Create 
trips_router.post("/trips/start_trip",verify_token,trips_controller.start_trip);
//read basically get 

//delete 

//Update 

export default trips_router;