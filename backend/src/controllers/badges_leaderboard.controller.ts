import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { badges_leaderboard_services } from "../services/badges_leaderboard_services";
const badge_leaderboard_controller ={
    async evaluate_badges (req: AuthRequest, res: Response){
        try{
            const authenticated_user = req.user?.sub;
            const { data } = req.body;
            
            if(!authenticated_user){
                res.status(401).json({
                    error: "UNAUTHORIZED"
                });
                return;
            }
            if(!data?.user_id || data.user_id !== authenticated_user){
                res.status(401).json({
                    error: "UNAUTHORIZED"
                });
                return ;
            }
            const result = await badges_leaderboard_services.evaluate({
                user_id: authenticated_user,
                trip_id: data.trip_id,
                });

            res.status(200).json({
                data: result,
                message: "Badge evaluation complete",
            });

        } catch (error: any) {
            if (error.message.includes("Trip not found")) {
                res.status(404).json({
                    error: "NOT_FOUND",
                    message: "Trip not found",
                });
            } else if (error.message.includes("You do not own this trip")) {
                    res.status(401).json({
                        error: "UNAUTHORIZED",
                    });
            } else {
                res.status(500).json({
                     error: "INTERNAL_SERVER_ERROR",
                    message: "Could not evaluate badges",
                });
            }
        }
    },
};
export default badge_leaderboard_controller;