import { OrganizationRole, Prisma } from "@prisma/client";
import prisma from "../db/prisma";
import { act } from "react";
import { map_services } from "./map_services";
import { to_number } from "./trips_services";
import { ValidationError } from "../utils/errors";

export interface schedule_trip_data{
    vehicle_id: string;
    driver_id: string;
    planned_start_time: Date;
    title: string;
    description: string;
    planned_start_location:{
        address: string;
        lat: number;
        lng: number;
    };
    planned_end_location:{
        address: string;
        lat: number;
        lng: number;
    };
    stops?: {
        address: string;
        lat: number;
        lng: number;
        stop_order: number;
    }[];
};

export interface start_scheduled_trip_data{
    trip_id: string;
    vehicle_id: string;
    start_time: Date;
    start_location:{
        lat: number;
        lng: number;
    };
    fuel_level_start?: number;
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

        if(name.trim().length <= 0){
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
                phone_number: d.users.phone_number,
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

        if(data.stops && data.stops.length > 0){
            for(const stop of data.stops){
                if(!Number.isFinite(stop.lat) || !Number.isFinite(stop.lng)){
                    throw new Error("Invalid stop coordinates");
                }
            }

            data.stops = data.stops.sort((a, b) => (a.stop_order ?? 0) - (b.stop_order ?? 0))
                .map((stop, index) => ({
                    ...stop,
                    stop_order: index +1
                }));
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

        const route = await map_services.suggested_routes({
            start_lat: data.planned_start_location.lat,
            start_lng: data.planned_start_location.lng,
            dest_lat:  data.planned_end_location.lat,
            dest_lng: data.planned_end_location.lng,
            stops: data.stops ?? undefined
        });


        const BASE_BUFFER_SECONDS = 10*60;
        const PER_STOP_BUFFER_SECONDS = 5 * 60;

        const stop_count = data.stops?.length ?? 0;
        const buffer_seconds = BASE_BUFFER_SECONDS + (stop_count * PER_STOP_BUFFER_SECONDS);

        const total_seconds = route.travel_time_seconds + buffer_seconds;

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

        const new_trip = await prisma.$transaction(async (tx) => { 

            const trip = await tx.trips.create({
                data: {
                    user_id: data.driver_id,
                    vehicle_id: data.vehicle_id,
                    created_by: user_id,
                    status: 'SCHEDULED',
                    description: data.description,
                    title: data.title,
                    scheduled_for: new_start,
                    scheduled_end: new_end,
                    planned_start_addr: data.planned_start_location.address,
                    planned_start_lat: data.planned_start_location.lat,
                    planned_start_lng: data.planned_start_location.lng,
                    planned_end_addr: data.planned_end_location.address,
                    planned_dest_lat: data.planned_end_location.lat,
                    planned_dest_lng: data.planned_end_location.lng,
                    end_latitude: data.planned_end_location.lat,
                    end_longitude: data.planned_end_location.lng,
                    trip_stops: data.stops && data.stops.length > 0? {
                        create: data.stops.map((stop) => ({
                            stop_order: stop.stop_order,
                            address: stop.address,
                            latitude: stop.lat,
                            longitude: stop.lng,
                        }))
                    } : undefined
                },
                include: {
                    trip_stops: {
                        orderBy: { stop_order: 'asc'}
                    },
                },
            });

            return trip;

        }); 

        return {
            trip: new_trip,
            route: route.points
        };
    },

    /* istanbul ignore next - Add tests after endpoint stabilizes */
    async start_scheduled_trip(user_id: string, org_id: string, data: start_scheduled_trip_data){

        const new_trip = await prisma.$transaction(async (tx) => { 

            const user = await prisma.organization_members.findUnique({
                    where: { 
                        org_id_user_id: {
                            org_id, user_id
                        } 
                    }
            });

            if(!user){
                throw new Error("Driver not found");
            }

            const trips = await prisma.trips.findMany({
                where: {
                    user_id: user.user_id,
                    OR: [
                        {status: "IN_PROGRESS" },
                        { trip_id: data.trip_id, status: "SCHEDULED" },
                    ],
                },
            });

            const active_trip = trips.find(t => t.status === "IN_PROGRESS");
            const scheduled_trip = trips.find(t => t.trip_id === data.trip_id);

            if (active_trip) {
                throw new Error("Trip already in progress");
            }

            if(!scheduled_trip){
                throw new Error("Scheduled trip not found");
            }
            
            const vehicle_info = await prisma.vehicles.findUnique({
                where: {
                    vehicle_id: data.vehicle_id
                },
                select: {
                    make:true,
                    model:true,
                    year:true,
                    fuel_efficiency:true
                }
            });

            let fuel_est: number | null = null;
            let planned_distance_km: number | null = null;

            const dest_lat = to_number(scheduled_trip.planned_dest_lat);
            const dest_lng = to_number(scheduled_trip.planned_dest_lng);

            if (dest_lat && dest_lng) {
                const route = await map_services.suggested_routes({
                    start_lat: data.start_location.lat,
                    start_lng: data.start_location.lng,
                    dest_lat: dest_lat,
                    dest_lng: dest_lng,
                });

                planned_distance_km = route.distance_km;
                
                fuel_est = ((to_number(vehicle_info?.fuel_efficiency) ??0) / 100) * planned_distance_km;
            }

            const update_result = await prisma.trips.updateMany({
                where:{ trip_id: data.trip_id, status: "SCHEDULED" },
                data: {
                    user_id: user.user_id,
                    vehicle_id: data.vehicle_id,
                    start_time: data.start_time,
                    start_latitude: data.start_location.lat,
                    start_longitude: data.start_location.lng,
                    fuel_estimate: fuel_est,
                    fuel_level_start: data.fuel_level_start,
                    status: "IN_PROGRESS"
                },
            });

            if(update_result.count === 0){
                throw new Error("Trip no longer available to start");
            }

            return tx.trips.findUniqueOrThrow({where: { trip_id: data.trip_id }});

        });

        return new_trip;

    },

    async list_fleet_trips(user_id: string, org_id: string, filters: { driver_id?: string, status?: string, start_date?: Date, end_date?: Date }){

        if (filters?.start_date && isNaN(filters?.start_date.getTime())) {
            throw new ValidationError("Invalid start date", "start_date");
        }
        if (filters?.end_date && isNaN(filters?.end_date.getTime())) {
            throw new ValidationError("Invalid end date", "end_date");
        }

        
        const start_date = filters?.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end_date = filters?.end_date || new Date();

        if(start_date > end_date) {
            throw new ValidationError("Start date must be before end date", "dates");
        }
        
        const membership = await prisma.organization_members.findUnique({
                where: { 
                    org_id_user_id: {
                        org_id, user_id
                    } 
                },
                select: { role: true },
        });

        if(!membership) {
            throw new Error("Not a member of this organization");
        }

        const is_manager_or_admin = membership.role === OrganizationRole.ADMIN || membership.role === OrganizationRole.MANAGER;

        if(!is_manager_or_admin && filters?.driver_id && filters.driver_id !== user_id){
            throw new Error("Not authorized to view another driver's trips");
        }

        const where: Prisma.tripsWhereInput = {
            users: {
                org_memberships: {
                    some: { org_id },
                },
            },
            created_at: {
                gte: start_date,
                lte: end_date,
            },
            ...(filters?.status ? { status: filters.status } : {} ),
            ...(is_manager_or_admin
                ? filters?.driver_id 
                    ? { user_id: filters.driver_id }
                    : {}
                : { user_id }),
        };

        const trips = await prisma.trips.findMany({
            where,
            orderBy: { scheduled_for: 'asc' },
            select: {
                trip_id: true,
                status: true,
                scheduled_for: true,
                scheduled_end: true,
                planned_start_addr: true,
                planned_start_lat: true,
                planned_start_lng: true,
                planned_end_addr: true,
                planned_dest_lat: true,
                planned_dest_lng: true,
                distance_km: true,
                duration_minutes: true,
                vehicle_id: true,
                vehicles: {
                    select: { make: true, model: true, year: true },
                },
                ...(is_manager_or_admin
                    ? {
                        users: {
                            select: {
                                user_id: true,
                                name: true,
                                surname: true,
                                email: true,
                            },
                        },
                    }
                    : {}),
            },

        });

        const result = trips.map(({ users, ...trip }) => ({
            ...trip,
            driver: users ?? undefined,
        }));

        return result;
    }

};

