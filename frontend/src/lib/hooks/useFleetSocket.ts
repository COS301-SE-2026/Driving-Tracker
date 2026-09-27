"use client"

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { tokenManager } from "../auth/tokenManager";

export interface LocationUpdatePayload{
    trip_id: string;
    location: {
        lat: number;
        lng: number;
    };
    speed_kmh?: number;
    heading?: number;
    recorded_at: string;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export function useFleetSocket(org_id: string | null) {
    const socketRef = useRef<Socket | null>(null);
    const [driverLocations, setDriverLocations] = useState<Record<string, LocationUpdatePayload>>({});
    const [isConnected, setIsConnected] = useState(false);

    useEffect(()=> {

        const token = tokenManager.getAccessToken();

        if(!org_id || !token) return;

        const socket = io(SOCKET_URL, {
            auth: { token },
            transports: ["websocket", "polling"],
        });

        socketRef.current = socket;

        socket.on("connect", ()=> {
            setIsConnected(true);
            console.log("Connected to Socket server. Joining fleet room: ", org_id);


            socket.emit("join_fleet", org_id);
        });

        socket.on("disconnect", ()=> {
            setIsConnected(false);
        });

        socket.on("location:update", (data: LocationUpdatePayload) => {
            console.log("Received driver location update:", data);

            setDriverLocations((prev) => ({
                ...prev,
                [data.trip_id]: data,
            }));
        });

        socket.on("error", (err: { code: string; message: string }) => {
            console.error("Socket error:", err);
        });

        return () => {
            if(socket.connected) {
                socket.emit("leave_fleet", org_id);
                socket.disconnect();
            }
        };
    }, [org_id]);

    return  { isConnected, driverLocations };
}