
import { decodeJwt, type AppJwtClaims } from "./jwt";

class TokenManager {
    private accessToken: string | null = null;

    setAccessToken(token: string): void {
        this.accessToken = token;
    }

    getAccessToken(): string | null {
        return this.accessToken;
    }

    clearAccessToken(): void {
        this.accessToken = null;
    }

    getClaims(): AppJwtClaims | null {
        
        if (!this.accessToken) return null;

        return decodeJwt(this.accessToken);
    }

    isAccessTokenExpired(bufferSeconds = 10): boolean {

        const claims = this.getClaims();
        if(!claims?.exp) return true;

        const nowSeconds = Date.now() / 1000;

        return claims.exp - bufferSeconds <= nowSeconds;
    }
}

export const tokenManager = new TokenManager();