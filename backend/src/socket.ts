import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { AppJwtPayload } from './middleware/auth';
import { check_trip_access } from './middleware/trip_access';
import { fleet_services } from './services/fleet_services';

const ACCESS_SECRET = process.env.JWT_SECRET!;

let io: Server;

interface AuthedSocket extends Socket {
    data: {
        user_id: string;
        role: 'admin' | 'user';
        org_id?: string | null;
        fleet_org_id?: string | null;
        trip_id?: string | null;
        is_trip_owner?: boolean;
    }
}

interface LocationUpdatePayload {
    trip_id: string;
    location: {
        lat: number;
        lng: number;
    };
    speed_kmh?: number;
    heading?: number;
    recorded_at: string;
}

export function initSocket(httpServer: HttpServer){
    io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true,
        },
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth.token as string | undefined;

        if(!token) return next(new Error('UNAUTHORIZED'));

        try{
            const payload = jwt.verify(token, ACCESS_SECRET) as unknown as AppJwtPayload;
            socket.data.user_id = payload.sub;
            socket.data.role = payload.role;

            next();
        }catch(err: any){
            if(err instanceof jwt.TokenExpiredError){
                return next(new Error('TOKEN_EXPIRED'));
            }

            return next(new Error('UNAUTHORIZED'));
        }
    });

    io.on('connection', (socket: AuthedSocket)=> {

        socket.join(`user:${socket.data.user_id}`);

        socket.on('join_trip', async (trip_id: string)=> {

            if(socket.data.trip_id){
                return socket.emit('error', {code: 'ALREADY_IN_TRIP', event: 'join_trip', message: 'Leave current trip before joining another'})
            }

            const access = await check_trip_access(socket.data.user_id, trip_id);

            if(!access) return socket.emit('error', {code: 'FORBIDDEN', event: 'join_trip'});

            const org_id = await fleet_services.get_org_id_for_trip(trip_id);
            
            socket.data.org_id = org_id;
            socket.data.trip_id = trip_id;
            socket.data.is_trip_owner = access === 'owner';

            socket.join(`trip:${trip_id}`);
        });

        socket.on('leave_trip', (trip_id: string) => {

            if(socket.data.trip_id !== trip_id) return;

            socket.leave(`trip:${trip_id}`);
            socket.data.trip_id = null;
            socket.data.org_id = null;
            socket.data.is_trip_owner = undefined;

            console.log("leave_trip received: ", trip_id);
        });

        socket.on('join_fleet', async (org_id: string) => {

            if(socket.data.fleet_org_id){
                return socket.emit('error', {code: 'ALREADY_IN_FLEET', event: 'join_fleet', message: 'Leave current fleet view before joining another'});
            }

            const permission = await fleet_services.get_view_permission(socket.data.user_id, org_id);

            if(!permission){
                return socket.emit('error', {code: 'FORBIDDEN', event: 'join_fleet', message: 'You do not have permission to view this fleet'});
            }

            socket.data.fleet_org_id = org_id;

            socket.join(`fleet:${org_id}`);
        });

        socket.on('leave_fleet', (org_id: string) => {

            if(socket.data.fleet_org_id !== org_id) return;

            socket.leave(`fleet:${org_id}`);
            socket.data.org_id = null;
        });

        socket.on('location:update', async (data: LocationUpdatePayload ) => {


            if(!socket.data.is_trip_owner){
                return socket.emit('error', {code: 'FORBIDDEN', event: 'location:update', message: 'Only the trip owner can send location updates'});
            }

            if(typeof data.location.lat !== 'number' || typeof data.location.lng !== 'number'){
                return socket.emit('error', {code: 'INVALID_PAYLOAD', event: 'location:update'});
            }

            const rooms = [`trip:${data.trip_id}`];

            if(socket.data.org_id){
                rooms.push(`fleet:${socket.data.org_id}`);
            }

            io.to(rooms).emit('location:update', data);

            console.log("location:update received: ",data.location.lat,":",data.location.lng);

            //TODO: store vehicle latest location without await

        });

    });

    return io;

}

export async function force_revoke_trip_access(trip_id: string, contact_user_id: string){

    if(!io){ console.log("Attempted to revoke access before Socket.io was initialized");
         return; 
        }

    const user_room = `user:${contact_user_id}`;

    const trip_room = `trip:${trip_id}`;

    io.to(user_room).emit('access_revoked', { trip_id});

    const sockets = await io.in(user_room).fetchSockets();

    sockets.forEach((socket) => { socket.leave(trip_room); 
        console.log("Contact forced to leave trip room");
    });
}

export async function broadcast_trip_ended(trip_id: string){

    if(!io){ console.log("Attempted to broadcast end trip before Socket.io was initialized");
         return; 
        }

    const room = `trip:${trip_id}`;

    io.to(room).emit('trip_ended', { trip_id });

    io.in(room).socketsLeave(room);
    
}