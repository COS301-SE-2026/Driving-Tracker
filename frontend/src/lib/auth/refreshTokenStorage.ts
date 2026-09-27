
const REFRESH_TOKEN_KEY = "refresh_token";

export const refreshTokenStorage = {

    get(): string | null {

        if(typeof window === "undefined") return null;

        return sessionStorage.getItem(REFRESH_TOKEN_KEY);
    },
    set(token: string): void {
        if(typeof window === "undefined") return;
        sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
    },
    clear(): void {
        if(typeof window === "undefined") return;

        sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    },
};