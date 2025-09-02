import { Request, Response, NextFunction } from "express";
export interface CustomError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}
export declare const errorHandler: (err: CustomError, req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map