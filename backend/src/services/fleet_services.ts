import { OrganizationRole } from "@prisma/client";
import prisma from "../db/prisma";

export const fleet_services = {

    async get_org_id_for_trip(trip_id: string): Promise<string | null> {

        const trip = await prisma.trips.findUnique({
            where:{
                trip_id,
            },
            select: {
               vehicles: {
                    select: { org_id: true }
               },
            },
        });

        const org_id = trip?.vehicles?.org_id?? null;

        return org_id;
    },

    async get_view_permission(user_id: string, org_id: string):Promise<boolean> {

        const member = await prisma.organization_members.findUnique({
            where: {
                org_id_user_id: {
                    org_id,
                    user_id
                }    
            },
            select: { role: true },
        });

        if(!member) return false;

        return member.role == OrganizationRole.MANAGER || member.role == OrganizationRole.ADMIN;
    },

};

