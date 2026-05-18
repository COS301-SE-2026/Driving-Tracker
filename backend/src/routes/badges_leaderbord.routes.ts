import {Router, request, response } from "express";
import badge_leaderboard_controller from "../controllers/badges_leaderboard.controller";
import {verify_token} from '../middleware/auth';

const badges_leaderBoard_router = Router();

 

//the way the route is called in the front end for example rout.__(what ever it is post,patch...)("/trips/...", ...)look at mp for reference
//will structure in crud operations 

//post
badges_leaderBoard_router.post("/evaluate", verify_token,badge_leaderboard_controller.evaluate_badges); 

//read basically get 
badges_leaderBoard_router.get("/",verify_token, badge_leaderboard_controller.get_badges);
//delete 

//Update 

export default badges_leaderBoard_router;