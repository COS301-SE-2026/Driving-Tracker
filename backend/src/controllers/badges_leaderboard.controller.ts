import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { badges_leaderboard_services } from "../services/badges_leaderboard_services";
const badge_leaderboard_controller ={
    async evaluate_badges (req: AuthRequest, res: Response){

    },
};
export default badge_leaderboard_controller;