import { NextFunction, Request, Response } from "express";
import { AuthRequest } from "./auth";
import { Prisma } from '@prisma/client';
import prisma from '../db/prisma';


//Checks if a user owns a trip or is verified to view the trip, if it was shared with them
export async function requireTripAccess(req: AuthRequest, res: Response ,next: NextFunction){

    const { trip_id } = req.params;
    const user_id = req.user?.sub;

    const trip = await prisma.trips.findUnique({ where: { trip_id } });

    if(trip?.user_id === user_id){
        return next();
    }

    const share = await prisma.trip_location_shares.findFirst({
        where: {
            trip_id,
            revoked_at: null,
            contact: {
                contact_user_id: user_id,
                consent_status: "APPROVED"
            },
        },
    });

    if(!share) return res.status(403).json({ error: "UNAUTHORIZED", message: "You are not authorized to view this trip"});

    next();
}