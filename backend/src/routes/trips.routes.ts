import {Router, request, response } from "express";
import * as trips_controller from "../controllers/trips.controller";
import {verify_token} from '../middleware/auth';

const trips_router = Router();
//the way the route is called in the front end for example rout.__(what ever it is post,patch...)("/trips/...", ...)look at mp for reference
//will structure in crud operations 

//Create 
trips_router.post("/start_trip",verify_token,trips_controller.start_trip);
trips_router.post("/:trip_id/readings/record",verify_token,trips_controller.record_trip);
trips_router.post("/:trip_id/events/log", verify_token, trips_controller.log_event);
//read basically get 
trips_router.get("/history",verify_token,trips_controller.get_history);
trips_router.get("/:trip_id/summary", verify_token, trips_controller.get_trip_summary);
//delete 

//Update 
trips_router.patch("/:trip_id/end_trip",verify_token,trips_controller.end_trip);
export default trips_router;