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

    async add_organization(user_id: string, name: string){

        if(name.trim.length <= 0){
            throw new Error('Name cannot be empty');
        }

        const result = await prisma.$transaction(async (tx) => { 

            const organization = await tx.organizations.create({
                data: {
                    name
                },
            });
            
            if(!organization){
                throw new Error('Failed to create organization');
            }

            const member = await tx.organization_members.create({
                data:{
                    org_id: organization.org_id,
                    user_id,
                    role: OrganizationRole.ADMIN
                },
            });

            if(!member){
                throw new Error('Failed to add user to organization');
            }

            return organization;
        
        });

        return { org_id: result.org_id }
    }

};

