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
  
  export interface DecodedToken {
    header: {
      alg: string;
      typ?: string;
      kid?: string;
      [key: string]: any;
    };
    payload: JwtPayload;
    signature: string;
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
  
  export function decode(token: string, options?: { complete: true }): DecodedToken | null;
  export function decode(token: string, options?: { complete?: false }): JwtPayload | null;
  export function decode(token: string, options?: { complete?: boolean }): JwtPayload | DecodedToken | null;
  export function verify(token: string, secretOrPublicKey: string, options?: any): JwtPayload;
}

declare module 'uuid';
declare module 'crypto-js'; 