import { Request, Response, NextFunction } from "express";
import { IUser } from "../models/User";
declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}
export interface JWTPayload {
    id: string;
    email: string;
    role: string;
    iat: number;
    exp: number;
}
export declare const protect: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const authorize: (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const checkOwnership: (resourceUserIdField?: string) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map