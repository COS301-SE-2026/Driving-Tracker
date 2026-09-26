import { tokenManager  } from "./tokenManager";
import { refreshAccessToken, logout } from "./authService";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

interface ApiErrorBody {
    error: string;
    message?: string;
}

export class ApiError extends Error {
    status: number;
    code?: string;
    constructor(status: number, message: string, code?: string){
        super(message);
        this.status = status;
        this.code = code;
    }
}

async function request(path: string, options: RequestInit = {}, isRetry = false): Promise<Response> {

    const accessToken = tokenManager.getAccessToken();

    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");
    if(accessToken){
        headers.set("Authorization", `Bearer ${accessToken}`);
    }

    const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

    if(res.status === 401 && !isRetry){
        const body: ApiErrorBody = await res.clone().json().catch(() => ({}));

        if(body.error === "TOKEN_EXPIRED") {
            const newToken = await refreshAccessToken();

            if(newToken){
                return request(path, options, true);
            }
        }

        await logout();
        if(typeof window !== "undefined") {
            window.location.href = "/login";
        }
    }

    return res;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {

    const res = await request(path, options);

    if(!res.ok) {
        const body: ApiErrorBody = await res.json().catch(() => ({}));
        throw new ApiError(res.status, body.message ?? "Request failed", body.error);
    }

    if(res.status === 204) return undefined as T; 

    return res.json();
}