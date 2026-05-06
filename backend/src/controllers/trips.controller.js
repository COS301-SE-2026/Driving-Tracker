import {Request, Response} from "express";
import {trips_services} from  "../services/trips_services";
import {auth_request} from "../middleware/auth";//the file containing the tokens 

//trips controllers will go here, so what is served by the api back to the frontend  