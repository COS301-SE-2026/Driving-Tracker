import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { AppJwtPayload } from './middleware/auth';
import { check_trip_access } from './middleware/trip_access';

const ACCESS_SECRET = process.env.JWT_SECRET!;

interface AuthedSocket extends Socket {
    data: {
        user_id: string;
        role: 'admin' | 'user';
        org_id?: string;
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
    const io = new Server(httpServer, {
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
        socket.on('join_trip', async (trip_id: string)=> {
            const has_access = await check_trip_access(socket.data.user_id, trip_id);

            if(!has_access) return socket.emit('error', {code: 'FORBIDDEN', event: 'join_trip'});
            socket.join(`trip:${trip_id}`);
        });

        socket.on('leave_trip', (trip_id: string) => {

            socket.leave(`trip:${trip_id}`);
        });

        socket.on('join_fleet', async (org_id: string) => {
            if(socket.data.org_id !== org_id){
                return socket.emit('error', {code: 'FORBIDDEN', event: 'join_fleet', org_id});
            }

            socket.join(`fleet:${org_id}`);
        });

        socket.on('leave_fleet', (org_id: string) => {

            socket.leave(`fleet:${org_id}`);
        });

        socket.on('location:update', async (data: LocationUpdatePayload ) => {

            if(!socket.rooms.has(`trip:${data.trip_id}`)) {
                return socket.emit('error', {code: 'FORBIDDEN', event: 'location:update', trip_id: data.trip_id});
            }

            if(typeof data.location.lat !== 'number' || typeof data.location.lng !== 'number'){
                return socket.emit('error', {code: 'INVALID_PAYLOAD', event: 'location:update'});
            }

            io.to(`trip:${data.trip_id}`).emit('location:update', data);
        });

    });


}