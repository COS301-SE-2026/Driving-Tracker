import {Router, request, response } from "express";
import * as vehicle from "../controllers/vehicle.controller";
import {verify_token} from '../middleware/auth';

const vehicle_router = Router();
//the way the route is called in the front end for example rout.__(what ever it is post,patch...)("/trips/...", ...)look at mp for reference
//will structure in crud operations 

//Create 

//read basically get 
vehicle_router.get("/get_all_vehicles/:user_id",verify_token,vehicle.get_all_vehicles);
//delete 

//Update 

export default vehicle_router;