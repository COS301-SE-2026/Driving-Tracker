"use client"

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { tokenManager } from "../auth/tokenManager";

export interface LocationUpdatePayload{
    trip_id: string;
    user_id: string;
    location: {
        lat: number;
        lng: number;
    };
    speed_kmh?: number;
    heading?: number;
    recorded_at: string;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export function useFleetSocket(
    orgId: string | null,
    onLocationUpdate?: (data: LocationUpdatePayload) => void,
    onTripEnded?: (driver_id: string) => void,
) {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(()=> {

        const token = tokenManager.getAccessToken();

        if(!orgId || !token) return;

        const socket = io(SOCKET_URL, {
            auth: { token },
            transports: ["websocket", "polling"],
        });

        socketRef.current = socket;

        socket.on("connect", ()=> {
            setIsConnected(true);
            console.log("Connected to Socket server. Joining fleet room: ", orgId);


            socket.emit("join_fleet", orgId);
        });

        socket.on("disconnect", ()=> {
            setIsConnected(false);
        });

        socket.on("location:update", (data: LocationUpdatePayload) => {
            console.log("Received driver location update:", data);

            if(onLocationUpdate) {
                onLocationUpdate(data);
            }
        });

        socket.on("trip_ended", (data: { trip_id: string, user_id: string }) => {
            console.log("Received driver location update:", data);

            if(onTripEnded) {
                onTripEnded(data.user_id);
            }
        });

        socket.on("error", (err: { code: string; event: string; message?: string }) => {
            console.error("Socket error:", err);
        });

        return () => {
            if(socket.connected) {
                socket.emit("leave_fleet", orgId);
                socket.disconnect();
            }
        };
    }, [orgId, onLocationUpdate, onTripEnded]);

    return  { isConnected };
}