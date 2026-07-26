import {Router, request, response } from "express";
import badge_leaderboard_controller from "../controllers/badges_leaderboard.controller";
import {verify_token} from '../middleware/auth';
import { user_based_limiter } from "../middleware/rate_limit";

const badges_leaderBoard_router = Router();

 

//the way the route is called in the front end for example rout.__(what ever it is post,patch...)("/trips/...", ...)look at mp for reference
//will structure in crud operations 

//post
badges_leaderBoard_router.post("/evaluate", verify_token, user_based_limiter, badge_leaderboard_controller.evaluate_badges); 

//read basically get 
badges_leaderBoard_router.get("/",verify_token, user_based_limiter, badge_leaderboard_controller.get_badges);
badges_leaderBoard_router.get("/definitions", verify_token, user_based_limiter, badge_leaderboard_controller.get_badge_definitions);
//delete 

//Update 

export default badges_leaderBoard_router;