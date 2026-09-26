import { tokenManager } from "./tokenManager";
import { refreshTokenStorage } from "./refreshTokenStorage";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

interface AuthResponse {
    token: string;
    refresh_token: string;
}

interface LogoutResponse {
    message: string;
}

export async function login(identifier: string, password: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier , password }),
    });

    if(!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? "Login failed");
    }

    const data: AuthResponse = await res.json();

    const claims = tokenManagerPeekClaims(data.token);

    if(claims?.org_role !== "ADMIN" && claims?.org_role !== "MANAGER") {
        throw new Error("This account does not have dashboard access");
    }

    tokenManager.setAccessToken(data.token);
    refreshTokenStorage.set(data.refresh_token);

}

export async function logout(): Promise<void> {

    const accessToken = tokenManager.getAccessToken();

    if(accessToken){
        try{

            await fetch(`${API_BASE_URL}/api/auth/logout`, {
                method: "POST",
                headers: {
                    "Content-Type" : "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
            });

        }catch {

        }
    }

    tokenManager.clearAccessToken();
    refreshTokenStorage.clear();
}

let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
    if(refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        const storedRefreshToken = refreshTokenStorage.get();
        if(!storedRefreshToken){
            tokenManager.clearAccessToken();
            return null;
        }

        try{

            const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type" : "application/json" },
                body: JSON.stringify({ refresh_token: storedRefreshToken }),
            });

            if(!res.ok) {
                tokenManager.clearAccessToken();
                refreshTokenStorage.clear();
                return null;
            }

            const data: AuthResponse = await res.json();

            tokenManager.setAccessToken(data.token);
            refreshTokenStorage.set(data.refresh_token);

            return data.token;

        } catch {
            tokenManager.clearAccessToken();
            refreshTokenStorage.clear();
            return null;
        }
    })();

    try {
        return await refreshPromise;
    } finally {
        refreshPromise = null;
    }
}


function tokenManagerPeekClaims(token: string){
    try {

        const payload = token.split(".")[1];
        return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    }catch {
        return null;
    }
}