
export interface AppJwtClaims {
    sub: string;
    role: "admin" | "user";
    org_role?: "ADMIN" | "MANAGER" | "DRIVER" | null;
    org_id?: string | null;
    exp?: number;
    iat?: number;
    [key: string]: unknown;
}

export function decodeJwt(token: string): AppJwtClaims | null {

    try {

        const payloadSegment = token.split(".")[1];

        if(!payloadSegment) return null;

        const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

        const json = decodeURIComponent(
            atob(padded)
                .split("")
                .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
                .join("")
        );

        return JSON.parse(json) as AppJwtClaims;
    } catch {
        return null;
    }
}