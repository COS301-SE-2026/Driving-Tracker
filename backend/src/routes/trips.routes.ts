import {Router, request, response } from "express";
import * as trips_controller from "../controllers/trips.controller";
import {verify_token} from '../middleware/auth';

const trips_router = Router();
//the way the route is called in the front end for example rout.__(what ever it is post,patch...)("/trips/...", ...)look at mp for reference
//will structure in crud operations 

//Create 
trips_router.post("/trips/start_trip",verify_token,trips_controller.start_trip);
trips_router.post("/trips/:trip_id/readings/record",verify_token,trips_controller.record_trip);
//read basically get 

//delete 

//Update 
trips_router.patch("/trips/:trip_id/end_trip",verify_token,trips_controller.end_trip);
export default trips_router;