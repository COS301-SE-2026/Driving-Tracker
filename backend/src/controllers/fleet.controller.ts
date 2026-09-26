import { AuthRequest } from "../middleware/auth";
import { Response } from 'express';
import { fleet_services } from "../services/fleet_services";
import { OrganizationRole } from '@prisma/client';
import { auth_services } from "../services/auth_services";
import { vehicle_services } from "../services/vehicle.services";
import { ConflictError, ExtendedError, ValidationError } from '../utils/errors';
import { Or } from "@prisma/client/runtime/client";

function check_org_authorization(
    res: Response,
    org_role: OrganizationRole | null | undefined,
    org_id: string | null | undefined,
    message: string = 'You do not have permissions to perform this action',
    allowed_roles: OrganizationRole[] = [],
){
    if((org_role && !org_id) || (org_id && !org_role)){
            res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong processing your session' });
            return false;
        }
        
    if((!org_role && !org_id) || (allowed_roles.length > 0 && !allowed_roles.includes(org_role!)) || !org_id){
        res.status(403).json({ error: 'UNAUTHORIZED', message });
        return false;
    }

    return true;
}


const fleet_controller = {
    async add_organization(req: AuthRequest, res: Response){

        const user_id = req.user?.sub;

        if(!user_id){
            return res.status(401).json({
                error: "UNAUTHORIZED"
            });
        }

        try{

            const { name } = req.body;
            
            const result = await fleet_services.add_organization(user_id, name);

            return res.status(201).json({
                message: 'Organization successfully added',
                data: result,
            });

        }catch(error: any){

            if(error.message.includes("Failed to create organization")){

                return res.status(500).json({
                    error: "INTERNAL_SERVER_ERROR", message: "Failed to add organization"
                });
            }

            if(error.message.includes("Name cannot be empty")){

                return res.status(422).json({
                    error: "INVALID_NAME", message: "Name cannot be empty"
                });
            }

            if(error.message.includes("Failed to add user to organization")){

                return res.status(500).json({
                    error: "INTERNAL_SERVER_ERROR", message: "Failed to add user to organization"
                });
            }
  
            return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });

        }

    },

    async list_fleet_drivers(req: AuthRequest, res: Response){
        const user_id = req.user?.sub;
        const org_id = req.user?.org_id;
        const org_role = req.user?.org_role;

        if(!user_id){
            return res.status(401).json({
                error: "UNAUTHORIZED"
            });
        }

        if(!check_org_authorization(res, org_role as OrganizationRole, org_id
            , "You do not have the permissions to list fleet drivers"
            , [OrganizationRole.ADMIN, OrganizationRole.MANAGER])){  return; }

        try{
            
            const drivers = await fleet_services.list_fleet_drivers(user_id, org_id!);

            return res.status(200).json({
                message: 'Fleet drivers successfully retrieved',
                data: { drivers },
            });

        }catch(error: any){

            if(error?.message?.includes("You do not have permission to list fleet drivers")){

                return res.status(403).json({
                    error: "UNAUTHORIZED", message: error.message
                });
            }
  
            return res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to retrieve fleet drivers" });

        }
    },

    async list_fleet_vehicles(req: AuthRequest, res: Response){
        const user_id = req.user?.sub;
        const org_id = req.user?.org_id;
        const org_role = req.user?.org_role;

        if(!user_id){
            return res.status(401).json({
                error: "UNAUTHORIZED"
            });
        }

        if(!check_org_authorization(res, org_role as OrganizationRole, org_id
            , 'You do not have the permissions to list fleet vehicles')){  return; }

        try{
            
            const vehicles = await fleet_services.list_fleet_vehicles(user_id, org_id!);

            return res.status(200).json({
                message: 'Fleet vehicles successfully retrieved',
                data: { vehicles },
            });

        }catch(error: any){

            if(error?.message?.includes("You do not have permission to list fleet vehicles")){

                return res.status(403).json({
                    error: "UNAUTHORIZED", message: error.message
                });
            }
  
            return res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to retrieve fleet vehicles" });

        }
    },

     async schedule_trip(req: AuthRequest, res: Response){
        const user_id = req.user?.sub;
        const org_id = req.user?.org_id;
        const org_role = req.user?.org_role;

        if(!user_id){
            return res.status(401).json({
                error: "UNAUTHORIZED"
            });
        }

        if(!check_org_authorization(res, org_role as OrganizationRole, org_id
            , "You do not have the permissions to schedule a trip"
            , [OrganizationRole.ADMIN, OrganizationRole.MANAGER])){  return; }

        const {
            vehicle_id,
            driver_id,
            planned_start_time,
            title,
            task,
            planned_start_location,
            planned_end_location,
            stops
            } = req.body;

        try{
            
            const trip = await fleet_services.schedule_trip(user_id, org_id!, {
                vehicle_id,
                driver_id,
                planned_start_time,
                title,
                description: task,
                planned_start_location,
                planned_end_location,
                stops
            });

            return res.status(201).json({
                message: 'Trip successfully scheduled',
                data: trip,
            });

        }catch(error: any){

            if(error?.message?.includes("Driver not found")){

                return res.status(404).json({
                    error: "DRIVER_NOT_FOUND", message: error.message
                });
            }

            if(error?.message?.includes("Driver not available")){

                return res.status(409).json({
                    error: "DRIVER_NOT_AVAILABLE", message: "Driver currently has an active trip"
                });
            }

            if(error.message.includes("Missing required fields")){
                res.status(422).json({
                    error: "MISSING_REQUIRED_FIELDS",
                    message: "User or vehicle not known"
                });
            }

            if(error.message.includes("Driver has a scheduled trip that overlaps this time")){
                res.status(409).json({
                    error: "DRIVER_NOT_AVAILABLE",
                    message: "Driver is not available during the scheduled time"
                });
            }

            if(error.message.includes("Unknown start location")){
                res.status(422).json({
                    error: "INVALID_START_LOCATION",
                    message: "Invalid start location"
                });
            }

            if(error.message.includes("Unknown end location")){
                res.status(422).json({
                    error: "INVALID_END_LOCATION",
                    message: "Invalid end location"
                });
            }

            if(error.message.includes("Invalid stop coordinates")){
                res.status(422).json({
                    error: "INVALID_STOP",
                    message: "Invalid coordinates for one or more stops"
                });
            }
  
            return res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to schedule trip" });

        }
    },

    async start_scheduled_trip(req: AuthRequest, res: Response){
        const user_id = req.user?.sub;
        const org_id = req.user?.org_id;
        const org_role = req.user?.org_role;

        if(!user_id){
            return res.status(401).json({
                error: "UNAUTHORIZED"
            });
        }

        if(!check_org_authorization(res, org_role as OrganizationRole, org_id
            , 'You do not have the permissions to start scheduled trips')){  return; }

        try{

            const { trip_id } = req.params;

            const {
                    vehicle_id,
                    start_time,
                    start_location,
                    fuel_level_start,
                } = req.body;
            
            const trip = await fleet_services.start_scheduled_trip(user_id, org_id!, {
                trip_id,
                vehicle_id,
                start_time,
                start_location,
                fuel_level_start
            });

            return res.status(200).json({
                message: 'Scheduled trip started successfully',
                data: trip,
            });

        }catch(error: any){

            if(error?.message?.includes("Driver not found")){

                return res.status(404).json({
                    error: "USER_NOT_FOUND", message: error.message
                });
            }

            if(error?.message?.includes("Trip already in progress")){

                return res.status(409).json({
                    error: "TRIP_IN_PROGRESS", message: error.message
                });
            }

            if(error?.message?.includes("Scheduled trip not found")){

                return res.status(404).json({
                    error: "TRIP_NOT_FOUND", message: error.message
                });
            }

            if(error?.message?.includes("Trip no longer available to start")){

                return res.status(409).json({
                    error: "CANNOT_START_TRIP", message: error.message
                });
            }

            if(error?.message?.includes("Invalid start time")){

                return res.status(422).json({
                    error: "INVALID_START_TIME", message: error.message
                });
            }
  
            return res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to start scheduled trip" });

        }
    },

    async list_fleet_trips(req: AuthRequest, res: Response){
        const user_id = req.user?.sub;
        const org_id = req.user?.org_id;
        const org_role = req.user?.org_role;

        if(!user_id){
            return res.status(401).json({
                error: "UNAUTHORIZED"
            });
        }

        if(!check_org_authorization(res, org_role as OrganizationRole, org_id
            , 'You do not have the permissions to list scheduled trips')){  return; }

        const driver_id = req.query.driver_id as string | undefined;

         const { status, start_date, end_date} = (req.query || {}) as any;

        try{
        
            const trips = await fleet_services.list_fleet_trips(user_id, org_id!, { driver_id, status, start_date, end_date });

            return res.status(200).json({
                message: 'Fleet trips retrieved successfully',
                data: { trips },
            });

        }catch(error: any){

            if(error instanceof ValidationError){

                return res.status(422).json({
                    error: error.errorCode , message: error.message
                });
            }

            if(error?.message?.includes("Not a member of this organization")){

                return res.status(403).json({
                    error: "UNAUTHORIZED", message: error.message
                });
            }
  
            return res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to retrieve scheduled trips" });
        }

    },

    async add_fleet_vehicle(req: AuthRequest,res: Response){
        try{
            const user_id = req.user?.sub;
            if(!user_id){
                res.status(403).json({ error: 'UNAUTHORIZED', message: 'Unauthorized' });
                return;
            }
    
            const org_role = req.user?.org_role;
    
            const org_id = req.user?.org_id;

            if(!check_org_authorization(res, org_role as OrganizationRole, org_id
            , 'You do not have the permissions to add a fleet vehicle'
            , [OrganizationRole.ADMIN, OrganizationRole.MANAGER])){  return; }
    
            const { name, registration, make, model, year, fuel_type, fuel_tank } = req.body;
    
            if( !make || !model || !year || !fuel_type || !fuel_tank){
                res.status(400).json({
                    error: "MISSING_REQUIRED_FIELDS", message: "Missing required fields: make, model, year, fuel_type, fuel_tank",
                });
                return;
            }
    
            const result = await vehicle_services.add_fleet_vehicle({
                user_id,
                name,
                registration,
                make,
                model,
                year,
                fuel_type,
                fuel_tank
            }, org_id!);
    
            res.status(201).json(result);
    
        }catch(error: any){
            if(error.message.includes("User does not exist")){
                res.status(404).json({
                    error: "MEMBER_NOT_FOUND",
                    message: "Member not found"
                });
                return;
            }
            if(error.message.includes("Missing field(s)")){
                res.status(400).json({
                    error: "MISSING_REQUIRED_FIELDS",
                    message: "Missing required fields"
                });
                return;
            }
    
            if(error.message.includes("You do not have access to add fleet vehicles")){
                res.status(403).json({
                    error: "UNAUTHORIZED",
                    message: "You do not have the permissions to add a fleet vehicle"
                });
                return;
            }
            
            res.status(500).json({
                error: "INTERNAL_SERVER",
                message: error.message ? error.message: "Internal server error"
            });
        }
    },

    async add_driver(req:AuthRequest, res: Response){

        const user_id = req.user?.sub;
        const org_id = req.user?.org_id;
        const org_role = req.user?.org_role;

        if(!user_id){
            return res.status(401).json({
                error: "UNAUTHORIZED"
            });
        }

        if(!check_org_authorization(res, org_role as OrganizationRole, org_id
            , 'You do not have the permissions to add a driver'
            , [OrganizationRole.ADMIN, OrganizationRole.MANAGER])){  return; }
    
            
        const {email, username, name, surname, phone_number, dob } = req.body;

        try{

            await auth_services.add_driver_to_org(user_id, org_id!, { email, username, name, surname, phone_number, dob });

            return res.status(201).json({
                message: "Successfully added driver"
            });

        }catch(err:any){

            if(err instanceof ValidationError){
                res.status(422).json({error: err.errorCode, message: err.message});
                return;
            }

            if(err instanceof ConflictError){
                res.status(409).json({error: err.errorCode, message: err.message});
                return;
            }

            if(err instanceof ExtendedError && err.errorCode == "UNAUTHORIZED"){
                res.status(403).json({error: err.errorCode, message: err.message});
                return;
            }

            res.status(500).json({error:"INTERNAL_SERVER_ERROR"});
            return;
            
        }
    },
};

export default fleet_controller;