import {Router, request, response } from "express";
import * as vehicle from "../controllers/vehicle.controller";
import {verify_token} from '../middleware/auth';
import { user_based_limiter } from "../middleware/rate_limit";

const vehicle_router = Router();
//the way the route is called in the front end for example rout.__(what ever it is post,patch...)("/trips/...", ...)look at mp for reference
//will structure in crud operations 

//Create
 vehicle_router.post("/assign_vehicle", user_based_limiter, verify_token,vehicle.assign_vehicle);
//read basically get 
vehicle_router.get("/get_all_vehicles", user_based_limiter, verify_token,vehicle.get_all_vehicles);
//delete 
vehicle_router.delete("/:vehicle_id", verify_token, vehicle.remove_vehicle);
//Update 
vehicle_router.patch("/:vehicle_id/name", verify_token, vehicle.update_name);
export default vehicle_router;