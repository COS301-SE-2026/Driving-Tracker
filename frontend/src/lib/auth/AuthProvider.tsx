"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"; 
import { refreshAccessToken } from "./authService";
import { tokenManager } from "./tokenManager";

interface AuthContextValue {
    isInitializing: boolean;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue>({
    isInitializing: true,
    isAuthenticated: false,
});

export function useAuth(){
    return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }){
    const [isInitializing, setIsInitializing] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function rehydrate(){
            const token = await refreshAccessToken();
            
            if(cancelled) return;
            setIsAuthenticated(!!token);
            setIsInitializing(false);
        }

        if(tokenManager.getAccessToken()){
            setIsAuthenticated(true);
            setIsInitializing(false);
        } else {
            rehydrate();
        }

        return () => {
            cancelled = true;
        };

    }, []);

    return (
        <AuthContext.Provider value = {{ isInitializing, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
}