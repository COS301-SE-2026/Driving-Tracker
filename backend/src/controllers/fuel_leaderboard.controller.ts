import type { Response } from "express";
import type {  AuthRequest } from "../middleware/auth";
import { fuel_leaderboard_service } from "../services/fuel_leaderboard.service";

export const get_fuel_leaderboard = async (
    req: AuthRequest,
    res: Response,
) => {
    try {
        const authenticatedUserId = req.user?.sub;

        if (!authenticatedUserId) {
            return res.status(401).json({
                error: "UNAUTHORIZED",
                message: "Unauthorized",
            });
        }

        const userId = 
          typeof req.query.userId === "string"
            ? req.query.userId
            : authenticatedUserId;

        if (userId !== authenticatedUserId) {
            return res.status(403).json({
                error: "FORBIDDEN",
                message: "userId must match the authenticated user",
            });
        }

        const vehicleId = 
            req.query.vehicleId === "string"
                ? req.query.vehicleId
                : null;

        if (!vehicleId) {
            return res.status(400).json({
                error: "MISSING_REQUIRED_FIELDS",
                message: "vehicleId is required",
            });
        }

        const timeframeDays =
            req.query.timeframeDays === undefined
                ? 30
                : Number(req.query.timeframeDays);
        
        if (
            !Number.isInteger(timeframeDays) ||
            timeframeDays < 1 ||
            timeframeDays > 3650
        ) {
            return res.status(400).json({
                error: "INVALID_TIMEFRAME",
                message: "timeframeDays must be an integer between 1 and 3650",
            });
        }

        const result = await fuel_leaderboard_service.get_leaderboard({
            user_id: userId,
            vehicle_id: vehicleId,
            timeframe_days: timeframeDays,
        });

        return res.status(200).json(result);
    } catch (error: any) {
        if (
            error.message === "Vehicle not found or not owned by user"
        ) {
            return res.status(404).json({
                error: "VEHICLE_NOT_FOUND",
                message: error.message,
            });
        }

        if (
            error.message === "Vehicle is missing manufacturer specification fields"
        ) {
            return res.status(422).json({
                error: "INCOMPLETE_VEHICLE_SPECIFICATION",
                message: error.message,
            });
        }

        console.error("Fuel leaderboard error:", error);

        return res.status(500).json({
            error: "INTERNAL_SERVER_ERROR",
            message: "Could not retrieve fuel leaderboard",
        });
    }
};