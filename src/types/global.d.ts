// Global type declarations
declare module 'jsonwebtoken' {
  export interface JwtPayload {
    [key: string]: any;
    iss?: string;
    sub?: string;
    aud?: string | string[];
    exp?: number;
    nbf?: number;
    iat?: number;
    jti?: string;
  }
  
  export type Algorithm = 
    | 'HS256' | 'HS384' | 'HS512'
    | 'RS256' | 'RS384' | 'RS512'
    | 'ES256' | 'ES384' | 'ES512'
    | 'PS256' | 'PS384' | 'PS512'
    | 'none';
    
  export class TokenExpiredError extends Error {
    expiredAt: Date;
    constructor(message: string, expiredAt: Date);
  }
  
  export function decode(token: string, options?: { complete?: boolean; json?: boolean }): null | { [key: string]: any } | string;
  export function verify(token: string, secretOrPublicKey: string, options?: any): JwtPayload;
}

declare module 'uuid';
declare module 'ws' {
  export class WebSocket {
    on(event: string, listener: (...args: any[]) => void): this;
    send(data: any, callback?: (err?: Error) => void): void;
    close(code?: number, reason?: string): void;
  }
}
declare module 'crypto-js'; 