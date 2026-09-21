import { OrganizationRole } from "@prisma/client";
import prisma from "../db/prisma";
import { act } from "react";
import { map_services } from "./map_services";

export interface schedule_trip_data{
    vehicle_id: string;
    driver_id: string;
    data_source: "OBD" | "PHONE";
    planned_start_time: Date;
    planned_start_location:{
        lat: number;
        lng: number;
    };
    planned_end_location:{
        lat: number;
        lng: number;
    };
};

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

    async list_fleet_vehicles(user_id: string, org_id: string){

        const member = await prisma.organization_members.findUnique({
            where: {
                org_id_user_id: {
                    org_id,
                    user_id
                }    
            },
            select: { role: true },
        });

        if(!member){
            throw new Error('You do not have permission to list fleet vehicles');
        }

        const vehicles = await prisma.vehicles.findMany({
            where: {
                org_id,
            },
            include: {
                trips:{
                    where: {
                        status: { in: ['IN_PROGRESS', 'SCHEDULED'] }
                    },
                    select: {
                        status: true,
                        scheduled_for: true,
                    },
                }
            }
        });

        const vehicles_result = vehicles.map((v) => {

            const { trips: active_trips, ...vehicle_data } = v;

            let status = 'AVAILABLE'

            if(active_trips.some(t => t.status === 'IN_PROGRESS')){
                status = 'UNAVAILABLE';

            }else if(active_trips.some(t => t.status === 'SCHEDULED')){
                status = 'ASSIGNED'
            }
            

            return {
                ...vehicle_data,
                status,    
            };

        });

        return vehicles_result;
    
    },

    async schedule_trip(user_id: string, org_id: string, data: schedule_trip_data){

        if(!user_id || !data.vehicle_id || !data.driver_id){
            throw new Error("Missing required fields");
        }

        if(!data.planned_start_location.lat|| !data.planned_start_location.lng){
            throw new Error("Unknown start location");
        }

        if(!data.planned_end_location.lat|| !data.planned_end_location.lng){
            throw new Error("Unknown end location");
        }

        const driver = await prisma.organization_members.findUnique({
            where: {
                user_id: data.driver_id,
                org_id,
                role: OrganizationRole.DRIVER
            },
            select: {
                joined_at: true,
                users:{
                    select: {
                        trips:{
                            where: {
                                status: { in: ['IN_PROGRESS', 'SCHEDULED'] }
                            },
                            select: {
                                status: true,
                                scheduled_for: true,
                                scheduled_end: true,
                            },
                        },
                    }
                }
            }
        });

        if(!driver){
            throw new Error("Driver not found");
        }

        const trips = driver.users.trips;

        if(trips.some(t => t.status === 'IN_PROGRESS')){
            throw new Error("Driver not available");
        }

        const route = await map_services.suggested_routes({
            start_lat: data.planned_start_location.lat,
            start_lng: data.planned_start_location.lng,
            dest_lat:  data.planned_end_location.lat,
            dest_lng: data.planned_end_location.lng,
        });

        const BUFFER_SECONDS = 10*60;
        const total_seconds = route.travel_time_seconds+ BUFFER_SECONDS;

        const new_start = new Date(data.planned_start_time);
        const new_end = new Date(new_start.getTime() + total_seconds * 1000);

        const scheduled = trips.filter(t => t.status === 'SCHEDULED');

        const has_overlap = scheduled.some(t => {
            if(!t.scheduled_for || !t.scheduled_end) return false;
            return new_start < t.scheduled_end && t.scheduled_for < new_end;
        });

        if(has_overlap){ 
            throw new Error("Driver has a scheduled trip that overlaps this time");
        }

        const trip = await prisma.trips.create({
            data: {
                user_id: data.driver_id,
                vehicle_id: data.vehicle_id,
                created_by: user_id,
                status: 'SCHEDULED',
                scheduled_for: new_start,
                scheduled_end: new_end,
                duration_minutes: Math.round(total_seconds / 60),
                planned_start_lat: data.planned_start_location.lat,
                planned_start_lng: data.planned_start_location.lng,
                planned_dest_lat: data.planned_end_location.lat,
                planned_dest_lng: data.planned_end_location.lng,
            },
        });

        return {
            trip: trip,
            route: route.points
        };

    }



};

