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
    },

    async list_fleet_drivers(user_id: string, org_id: string){

        const permission = await this.get_view_permission(user_id, org_id);

        if(!permission){
            throw new Error('You do not have permission to list fleet drivers');
        }

        const drivers = await prisma.organization_members.findMany({
            where: {
                org_id,
                role: OrganizationRole.DRIVER
            },
            select: {
                joined_at: true,
                users:{
                    select: {
                        user_id: true,
                        username: true,
                        email: true,
                        name: true,
                        surname: true,
                        phone_number: true,
                        profile_picture_url: true,
                        trips:{
                            where: {
                                status: { in: ['IN_PROGRESS', 'SCHEDULED'] }
                            },
                            select: {
                                status: true
                            },
                        },
                    }
                }
            }
        });

        const drivers_result = drivers.map((d) => {

            const active_trips = d.users.trips;

            let status = 'AVAILABLE'

            if(active_trips.some(t => t.status === 'IN_PROGRESS')){
                status = 'UNAVAILABLE';

            }else if(active_trips.some(t => t.status === 'SCHEDULED')){
                status = 'ASSIGNED'
            }

            return {
                user_id: d.users.user_id,
                name: d.users.name,
                surname: d.users.surname,
                email: d.users.email,
                username: d.users.username,
                profile_picture_url: d.users.profile_picture_url,
                joined_at: d.joined_at,
                status
            }
        });

        return drivers_result;
    },



};

