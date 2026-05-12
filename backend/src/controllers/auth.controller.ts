import {Request, Response} from 'express';
import {auth_services} from  "../services/auth_services";
import {verify_token, generate_token} from "../middleware/auth";//the file containing the tokens 

const auth_controller={

    async register(req:Request, res: Response){

        const {email, username, password, name, surname, consent_status}=req.body;

        try{
            const {user, refresh_token}=await auth_services.register(email,username,name,surname,password,consent_status);

            const access_token=generate_token({sub: user.user_id, role: user.role});

            res.status(201).json({
                token:access_token, 
                refresh_token
            });

        }catch(err:any){

            if(err.code&&err.code==="P2002"){
                const field= err.meta?.target?.[0];

                if(field==="email"){
                    res.status(409).json({error:"EMAIL_TAKEN", message:"Email already in use"});
                    return;
                }

                if(field==="username"){
                    res.status(409).json({error:"USERNAME_TAKEN", message:"Username already in use"});
                    return;
                }   
            }

            if(err instanceof Error){

                if(err.message.includes("email")){

                     res.status(400).json({error:"INVALID_EMAIL", message: err.message})
                     return;

                } else if(err.message.includes("Username")){

                    res.status(400).json({error:"INVALID_USERNAME", message: err.message})
                    return;
                }else if(err.message.includes("Name")){

                    res.status(400).json({error:"INVALID_NAME/SURNAME", message: err.message})
                    return;
                }
            }

            res.status(500).json({error:"INTERNAL_SERVER_ERROR"})
            
        }
    },
    async login(req:Request, res: Response){

        const {identifier, password}=req.body;

        try{
            const {user, refresh_token}=await auth_services.login(identifier,password);

            const access_token=generate_token({sub: user.user_id, role: user.role});

            res.status(201).json({
                token:access_token, 
                refresh_token
            });

        }catch(err:any){

            if((err instanceof Error) && err.message.includes("credentials")){

                res.status(401).json({error:"INVALID_CREDENTIALS", message: "Invalid Email/Username or Password"});
                return; 
            }

            res.status(500).json({error:"INTERNAL_SERVER_ERROR"})
            
        }

    }

};

export default auth_controller;